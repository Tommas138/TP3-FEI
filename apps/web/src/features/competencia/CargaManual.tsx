import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import type { JugadorDelSorteo } from '@setpoint/shared';
import { useState, type ReactNode } from 'react';
import { Numero } from '../../components/Numero';
import type { ZonaACargar } from './zonas';

// Modo manual: la organización hizo el sorteo en persona y lo carga arrastrando a cada jugador
// a su zona (decisión 020). Lo que se arrastra son jugadores; lo que los recibe, las zonas y la
// lista de los que todavía no tienen zona.

const SIN_ZONA = 'sin-zona';

type Props = {
  jugadores: JugadorDelSorteo[];
  zonas: ZonaACargar[];
  // Cuántos entran como máximo en cada zona.
  capacidad: number;
  // null: vuelve a la lista de los que no tienen zona.
  alMover: (jugadorId: number, grupo: string | null) => void;
};

// Con el teclado, cada flecha lleva al jugador a la zona más cercana en esa dirección, en vez de
// moverlo de a unos píxeles.
const saltarDeZona: KeyboardCoordinateGetter = (evento, { context }) => {
  const direcciones: Record<string, [number, number]> = {
    ArrowRight: [1, 0],
    ArrowLeft: [-1, 0],
    ArrowDown: [0, 1],
    ArrowUp: [0, -1],
  };
  const direccion = direcciones[evento.code];
  const { collisionRect, droppableRects, droppableContainers } = context;
  if (!direccion || !collisionRect) return undefined;
  evento.preventDefault();

  const desde = { x: collisionRect.left + collisionRect.width / 2, y: collisionRect.top + collisionRect.height / 2 };
  let destino: { x: number; y: number } | null = null;
  let menor = Infinity;
  for (const contenedor of droppableContainers.getEnabled()) {
    const rect = droppableRects.get(contenedor.id);
    if (!rect) continue;
    // La zona en la que ya está no cuenta, aunque su centro quede hacia ese lado.
    const adentro = desde.x >= rect.left && desde.x <= rect.right && desde.y >= rect.top && desde.y <= rect.bottom;
    if (adentro) continue;
    const centro = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dx = centro.x - desde.x;
    const dy = centro.y - desde.y;
    // Solo cuentan las zonas que quedan hacia ese lado; entre ellas, la más cercana.
    if (dx * direccion[0] + dy * direccion[1] <= 1) continue;
    const distancia = Math.hypot(dx, dy);
    if (distancia < menor) {
      menor = distancia;
      destino = centro;
    }
  }
  if (!destino) return undefined;
  return { x: destino.x - collisionRect.width / 2, y: destino.y - collisionRect.height / 2 };
};

export function CargaManual({ jugadores, zonas, capacidad, alMover }: Props) {
  const [arrastrado, setArrastrado] = useState<JugadorDelSorteo | null>(null);
  const sensores = useSensors(
    // Unos píxeles de margen para que un clic no empiece a arrastrar.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: saltarDeZona }),
  );

  const sinZona = jugadores.filter((j) => !zonas.some((z) => z.integrantes.includes(j)));
  const jugadorDe = (id: UniqueIdentifier) => jugadores.find((j) => j.jugadorId === id);
  const nombreDe = (id: UniqueIdentifier) => jugadorDe(id)?.apellido ?? 'El jugador';
  const llena = (grupo: UniqueIdentifier) => (zonas.find((z) => z.grupo === grupo)?.integrantes.length ?? 0) >= capacidad;
  const destinoDe = (id: UniqueIdentifier) => (id === SIN_ZONA ? 'los que no tienen zona' : `la zona ${id}`);

  // Lo que escucha quien usa lector de pantalla.
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Levantaste a ${nombreDe(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nombreDe(active.id)} está sobre ${destinoDe(over.id)}.` : `${nombreDe(active.id)} no está sobre ninguna zona.`,
    onDragEnd: ({ active, over }) => {
      if (!over) return `${nombreDe(active.id)} volvió a su lugar.`;
      if (over.id !== SIN_ZONA && llena(over.id)) return `La zona ${over.id} está completa. ${nombreDe(active.id)} volvió a su lugar.`;
      return `${nombreDe(active.id)} quedó en ${destinoDe(over.id)}.`;
    },
    onDragCancel: ({ active }) => `Se canceló. ${nombreDe(active.id)} volvió a su lugar.`,
  };

  return (
    <DndContext
      sensors={sensores}
      accessibility={{
        announcements: anuncios,
        screenReaderInstructions: {
          draggable:
            'Para mover a un jugador, apretá espacio. Con las flechas lo llevás de una zona a otra; con espacio lo dejás y con escape cancelás.',
        },
      }}
      onDragStart={({ active }) => setArrastrado(jugadorDe(active.id) ?? null)}
      onDragCancel={() => setArrastrado(null)}
      onDragEnd={({ active, over }) => {
        setArrastrado(null);
        if (!over) return;
        const jugadorId = Number(active.id);
        if (over.id === SIN_ZONA) return alMover(jugadorId, null);
        const actual = zonas.find((z) => z.integrantes.some((j) => j.jugadorId === jugadorId));
        if (actual?.grupo === over.id || llena(over.id)) return;
        alMover(jugadorId, String(over.id));
      }}
    >
      <div className="flex flex-col gap-4">
        <Destino id={SIN_ZONA} className="flex flex-col gap-2.5 px-[15px] py-[13px]">
          <div className="flex items-baseline justify-between gap-2.5">
            <h3 className="text-[15px] font-semibold">Sin zona</h3>
            <span className="text-xs text-gris-500">
              {sinZona.length === 0 ? (
                'ya están todos ubicados'
              ) : (
                <>
                  faltan <Numero>{sinZona.length}</Numero>
                </>
              )}
            </span>
          </div>
          {sinZona.length === 0 ? (
            <p className="text-sm text-gris-500">Arrastrá un jugador hasta acá para sacarlo de su zona.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {sinZona.map((jugador) => (
                <li key={jugador.jugadorId}>
                  <Ficha jugador={jugador} suelta />
                </li>
              ))}
            </ul>
          )}
        </Destino>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {zonas.map((zona) => (
            <Destino key={zona.grupo} id={zona.grupo} llena={zona.integrantes.length >= capacidad} className="flex flex-col gap-1.5 px-[15px] py-[13px]">
              <div className="flex items-baseline justify-between gap-2.5 border-b border-linea-suave pb-[7px]">
                <h3 className="text-[15px] font-semibold">Zona {zona.grupo}</h3>
                <Numero className="text-xs text-gris-500">
                  {zona.integrantes.length} de {capacidad}
                </Numero>
              </div>
              <ul className="flex flex-col">
                {zona.integrantes.map((jugador) => (
                  <li key={jugador.jugadorId}>
                    <Ficha jugador={jugador} />
                  </li>
                ))}
                {Array.from({ length: Math.max(capacidad - zona.integrantes.length, 0) }, (_, i) => (
                  <li key={`libre-${i}`} className="flex h-[34px] items-center text-sm text-gris-400">
                    libre
                  </li>
                ))}
              </ul>
            </Destino>
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>{arrastrado && <Contenido jugador={arrastrado} levantado />}</DragOverlay>
    </DndContext>
  );
}

// Una zona, o la lista de los que no tienen zona, que recibe jugadores.
function Destino({ id, llena = false, className, children }: { id: string; llena?: boolean; className: string; children: ReactNode }) {
  const { setNodeRef, isOver, active } = useDroppable({ id });
  // Mientras se arrastra encima: contorno negro si lo puede recibir; si está completa, se apaga.
  const encima = isOver && active !== null;
  const estado = encima && llena ? 'bg-fondo' : encima ? 'bg-white outline-2 -outline-offset-1 outline-negro' : 'bg-white';

  return (
    <div ref={setNodeRef} className={`rounded-tarjeta border border-linea ${estado} ${className}`}>
      {children}
    </div>
  );
}

// Un jugador que se puede arrastrar. Suelta: en la lista de los que no tienen zona, como chip.
function Ficha({ jugador, suelta = false }: { jugador: JugadorDelSorteo; suelta?: boolean }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: jugador.jugadorId });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`${jugador.nombre} ${jugador.apellido}`}
      className={`w-full cursor-grab touch-none text-left focus-visible:outline-2 focus-visible:outline-negro ${isDragging ? 'opacity-40' : ''} ${
        suelta ? 'rounded-control border border-linea px-3 hover:bg-fondo' : 'rounded-[6px]'
      }`}
    >
      <Contenido jugador={jugador} />
    </button>
  );
}

function Contenido({ jugador, levantado = false }: { jugador: JugadorDelSorteo; levantado?: boolean }) {
  return (
    <span
      className={`flex h-[34px] items-center gap-2.5 ${
        levantado ? 'cursor-grabbing rounded-control border-2 border-negro bg-white px-3' : ''
      }`}
    >
      <Numero className="w-5 text-xs text-gris-400">
        {jugador.posicionSiembra === null ? '—' : String(jugador.posicionSiembra).padStart(2, '0')}
      </Numero>
      <span className="truncate text-sm">{jugador.apellido}</span>
    </span>
  );
}
