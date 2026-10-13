import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Boton } from '../components/Boton';
import { EncabezadoOrganizador } from '../components/EncabezadoOrganizador';
import { Numero } from '../components/Numero';
import { leerSesion, type Sesion } from '../features/auth/sesion';
import { useCerrarSesion } from '../features/auth/useCerrarSesion';
import {
  sorteoEjemplo,
  sumaDeSiembra,
  type ModoDistribucion,
  type ModoSorteo,
  type ZonaSorteada,
} from '../features/competencia/sorteoEjemplo';
import { TarjetaOpciones } from '../features/competencia/TarjetaOpciones';
import { TarjetaZona } from '../features/competencia/TarjetaZona';
import { iniciales, navegacionOrganizador } from '../features/organizador/encabezado';

const distribuciones: { valor: ModoDistribucion; etiqueta: string }[] = [
  { valor: 'serpentina', etiqueta: 'Serpentina' },
  { valor: 'directa', etiqueta: 'Directa' },
  { valor: 'bombos', etiqueta: 'Por bombos' },
];

const ayudaDistribucion: Record<ModoDistribucion, string> = {
  serpentina: 'La serpentina invierte la dirección en cada vuelta, así todas las zonas suman lo mismo.',
  directa: 'Reparte siempre de la zona A a la última: las primeras zonas quedan más fáciles que las últimas.',
  bombos: 'Sortea al azar dentro de cada franja del ranking, como en un sorteo presencial con bombos.',
};

// Sortear en pantalla y cargar a mano todavía no están: decisión abierta 6 del README de docs.
const ejecutores: { valor: ModoSorteo; etiqueta: string; deshabilitada?: boolean }[] = [
  { valor: 'automatico', etiqueta: 'Automático' },
  { valor: 'asistido', etiqueta: 'En pantalla', deshabilitada: true },
  { valor: 'manual', etiqueta: 'Lo cargo a mano', deshabilitada: true },
];

export function SorteoPage() {
  const sesion = leerSesion();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  return <SorteoDeZonas sesion={sesion} />;
}

// Todos contra todos: una zona de 4 juega 6 partidos.
function partidosDeZona(zonas: ZonaSorteada[]) {
  return zonas.reduce((total, { integrantes }) => total + (integrantes.length * (integrantes.length - 1)) / 2, 0);
}

function ResumenDeSumas({ zonas }: { zonas: ZonaSorteada[] }) {
  const sumas = zonas.map(sumaDeSiembra);
  const menor = Math.min(...sumas);
  const mayor = Math.max(...sumas);
  const parejas = menor === mayor;

  return (
    <div className="flex items-center gap-2.5">
      <span className={`size-[7px] shrink-0 rounded-full ${parejas ? 'bg-lima' : 'bg-gris-300'}`} />
      <p className="text-sm text-gris-700">
        {parejas ? (
          <>
            Las <Numero>{zonas.length}</Numero> zonas suman <Numero>{menor}</Numero>. Están parejas.
          </>
        ) : (
          <>
            Las zonas suman entre <Numero>{menor}</Numero> y <Numero>{mayor}</Numero>. No quedaron parejas.
          </>
        )}
      </p>
    </div>
  );
}

function SorteoDeZonas({ sesion }: { sesion: Sesion }) {
  const cerrarSesion = useCerrarSesion();
  // El torneo de la URL (/torneos/:id/sorteo) todavía no se usa: la pantalla muestra el ejemplo.
  const sorteo = sorteoEjemplo;
  const [distribucion, setDistribucion] = useState<ModoDistribucion>('serpentina');
  const [ejecutor, setEjecutor] = useState<ModoSorteo>('automatico');

  const zonas = sorteo.zonas[distribucion];
  const inscriptos = zonas.reduce((total, zona) => total + zona.integrantes.length, 0);

  return (
    <div className="flex min-h-screen flex-col bg-white text-negro">
      <EncabezadoOrganizador
        organizacion={sesion.organizacion.nombre}
        navegacion={navegacionOrganizador}
        iniciales={iniciales(sesion.usuario.nombre)}
        alSalir={cerrarSesion}
      />

      <div className="flex flex-wrap items-end justify-between gap-6 px-7 pt-[26px] pb-5">
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em]">Sorteo de zonas</h1>
          <p className="text-[15px] text-gris-500">
            <Numero>{inscriptos}</Numero> inscriptos · se arman <Numero>{zonas.length}</Numero> zonas de{' '}
            <Numero>{inscriptos / zonas.length}</Numero>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Numero className="flex h-9 items-center rounded-full border border-linea px-[13px] text-[13px]">
            {sorteo.edicion}
          </Numero>
          <span className="flex h-9 items-center rounded-full border border-linea px-[13px] font-mono text-[13px] text-gris-500">
            todavía no publicado
          </span>
        </div>
      </div>

      <main className="flex flex-col gap-[22px] px-7 pb-5">
        <div className="grid gap-5 md:grid-cols-2">
          <TarjetaOpciones
            titulo="Cómo se reparten"
            aclaracion="usa el ranking vigente"
            opciones={distribuciones}
            elegida={distribucion}
            alElegir={setDistribucion}
            ayuda={ayudaDistribucion[distribucion]}
          />
          <TarjetaOpciones
            titulo="Quién lo ejecuta"
            aclaracion="podés revisarlo antes de publicar"
            opciones={ejecutores}
            elegida={ejecutor}
            alElegir={setEjecutor}
            ayuda="El sistema sortea y vos revisás el resultado. Sortear en pantalla y cargar a mano un sorteo presencial todavía no están disponibles."
          />
        </div>

        <section className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">Así quedarían</h2>
            <ResumenDeSumas zonas={zonas} />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {zonas.map((zona) => (
              <TarjetaZona key={zona.grupo} zona={zona} />
            ))}
          </div>

          <p className="text-sm text-gris-500">El número es la posición de siembra, según el ranking al momento del sorteo.</p>
        </section>
      </main>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-5 border-t border-linea px-7 py-[18px]">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] font-semibold">
            Al confirmar se generan <Numero>{partidosDeZona(zonas)}</Numero> partidos de zona
          </p>
          <p className="text-sm text-gris-500">
            Los jugadores tienen <Numero>{sorteo.plazoGruposDias}</Numero> días para jugar la fase de grupos.
          </p>
        </div>
        {/* Sin acción todavía: sortear de nuevo y confirmar llegan con el endpoint de sorteo. */}
        <div className="flex gap-2.5">
          <Boton grande>Volver a sortear</Boton>
          <Boton variante="principal" grande className="font-semibold">
            Confirmar y publicar
          </Boton>
        </div>
      </footer>
    </div>
  );
}
