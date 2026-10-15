import {
  letrasDeZonas,
  tamanosDeZona,
  type ModoDistribucion,
  type ModoSorteo,
  type Sorteo,
  type ZonaSorteada,
} from '@setpoint/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Boton } from '../components/Boton';
import { EncabezadoOrganizador } from '../components/EncabezadoOrganizador';
import { Numero } from '../components/Numero';
import { leerSesion, type Sesion } from '../features/auth/sesion';
import { useCerrarSesion } from '../features/auth/useCerrarSesion';
import { useSesionInvalida } from '../features/auth/useSesionInvalida';
import { CargaManual } from '../features/competencia/CargaManual';
import { TarjetaOpciones } from '../features/competencia/TarjetaOpciones';
import { TarjetaZona } from '../features/competencia/TarjetaZona';
import { useCargarZonas, useConfirmarSorteo, useSorteo, useSortear } from '../features/competencia/useSorteo';
import {
  asignacionDeLasZonas,
  partidosDeZona,
  sumaDeSiembra,
  zonasDeLaAsignacion,
  type Asignacion,
} from '../features/competencia/zonas';
import { iniciales, navegacionOrganizador } from '../features/organizador/encabezado';
import { ErrorApi } from '../lib/api';

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

// Sortear en pantalla todavía no está.
const ejecutores: { valor: ModoSorteo; etiqueta: string; deshabilitada?: boolean }[] = [
  { valor: 'automatico', etiqueta: 'Automático' },
  { valor: 'asistido', etiqueta: 'En pantalla', deshabilitada: true },
  { valor: 'manual', etiqueta: 'Lo cargo a mano' },
];

const ayudaEjecutor: Record<ModoSorteo, string> = {
  automatico: 'El sistema sortea y vos revisás el resultado.',
  asistido: 'El sistema sortea en pantalla, para proyectarlo durante la reunión.',
  manual: 'Si el sorteo lo hacen presencial con bombos y lo graban, cargá el resultado a mano.',
};

export function SorteoPage() {
  const sesion = leerSesion();
  const { id } = useParams();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  return <CargarSorteo sesion={sesion} id={Number(id)} />;
}

function Encabezado({ sesion }: { sesion: Sesion }) {
  const cerrarSesion = useCerrarSesion();
  return (
    <EncabezadoOrganizador
      organizacion={sesion.organizacion.nombre}
      navegacion={navegacionOrganizador}
      iniciales={iniciales(sesion.usuario.nombre)}
      alSalir={cerrarSesion}
    />
  );
}

function CargarSorteo({ sesion, id }: { sesion: Sesion; id: number }) {
  const sorteo = useSorteo(sesion.organizacion.slug, id);
  const sesionInvalida = useSesionInvalida(sorteo.error);
  const navegar = useNavigate();

  if (sorteo.data) return <SorteoDeZonas sesion={sesion} sorteo={sorteo.data} />;

  const noExiste = sorteo.error?.message === 'TORNEO_NO_ENCONTRADO';

  return (
    <div className="min-h-screen bg-white text-negro">
      <Encabezado sesion={sesion} />
      <div className="flex flex-col items-start gap-3 px-7 pt-[26px]">
        {noExiste ? (
          <>
            <p className="text-[15px] text-gris-500">No encontramos ese torneo.</p>
            <Boton onClick={() => navegar('/inicio')}>Volver al inicio</Boton>
          </>
        ) : sorteo.error && !sesionInvalida ? (
          <>
            <p className="text-[15px] text-gris-500">No pudimos cargar el sorteo.</p>
            <Boton onClick={() => void sorteo.refetch()}>Probar de nuevo</Boton>
          </>
        ) : (
          <p className="text-[15px] text-gris-500">Cargando…</p>
        )}
      </div>
    </div>
  );
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

// "de 4", o "de 3 y 4" si el cupo no se llenó y algunas zonas quedan con uno menos.
function TamanoDeZonas({ inscriptos, grupos }: { inscriptos: number; grupos: number }) {
  const menor = Math.floor(inscriptos / grupos);
  const mayor = Math.ceil(inscriptos / grupos);
  if (menor === mayor) return <Numero>{menor}</Numero>;
  return (
    <>
      <Numero>{menor}</Numero> y <Numero>{mayor}</Numero>
    </>
  );
}

// Lo que explica por qué no se puede sortear o confirmar.
function textoDeError(error: Error, sorteo: Sorteo): ReactNode {
  const codigo = error instanceof ErrorApi ? error.codigo : '';
  switch (codigo) {
    case 'INSCRIPTOS_INSUFICIENTES':
      return (
        <>
          Hay <Numero>{sorteo.inscriptos}</Numero> inscriptos: no alcanzan para <Numero>{sorteo.cantidadGrupos}</Numero>{' '}
          zonas de al menos <Numero>3</Numero>.
        </>
      );
    case 'ZONAS_INVALIDAS':
      return 'Las zonas no tienen la cantidad de jugadores que corresponde. Revisalas antes de confirmar.';
    case 'SORTEO_DESACTUALIZADO':
      return 'Cambiaron los inscriptos desde el último sorteo. Volvé a sortear antes de confirmar.';
    case 'TORNEO_NO_SORTEABLE':
      return 'Este torneo ya no se puede sortear. Recargá la página para ver cómo quedó.';
    case 'SIN_CONEXION':
      return 'No hay conexión. Probá de nuevo.';
    default:
      return 'No se pudo completar. Probá de nuevo.';
  }
}

function SorteoDeZonas({ sesion, sorteo }: { sesion: Sesion; sorteo: Sorteo }) {
  const slug = sesion.organizacion.slug;
  const sortear = useSortear(slug, sorteo.torneoId);
  const cargar = useCargarZonas(slug, sorteo.torneoId);
  const confirmar = useConfirmarSorteo(slug, sorteo.torneoId);
  // Si el borrador se cargó a mano, se sigue desde ahí.
  const borradorManual = sorteo.modoSorteo === 'manual' && sorteo.zonas !== null;
  const [ejecutor, setEjecutor] = useState<ModoSorteo>(borradorManual ? 'manual' : 'automatico');
  const [asignacion, setAsignacion] = useState<Asignacion>(() => (borradorManual ? asignacionDeLasZonas(sorteo.zonas) : {}));

  const sorteable = sorteo.estado === 'inscripciones_cerradas' && !sorteo.confirmado;
  const ocupado = sortear.isPending || cargar.isPending || confirmar.isPending;
  const error = sortear.error ?? cargar.error ?? confirmar.error;
  useSesionInvalida(error);

  // Mientras se sortea se marca el modo pedido, no el que estaba.
  const distribucion = sortear.isPending ? sortear.variables.modoDistribucion : sorteo.modoDistribucion;
  const { zonas } = sorteo;

  // Modo manual: las zonas como las va armando la organización, antes de guardarlas.
  const cargandoAMano = ejecutor === 'manual' && !sorteo.confirmado;
  const zonasManuales = zonasDeLaAsignacion(sorteo.jugadores, letrasDeZonas(sorteo.cantidadGrupos), asignacion);
  const { menor, mayor } = tamanosDeZona(sorteo.inscriptos, sorteo.cantidadGrupos);
  const minimoPorZona = Math.max(menor, 3);
  const sinUbicar = sorteo.jugadores.length - Object.keys(asignacion).length;
  const zonaCorta = zonasManuales.find((z) => z.integrantes.length < minimoPorZona);
  const cargaCompleta = sinUbicar === 0 && zonaCorta === undefined;

  // La primera vez que se abre con la inscripción cerrada se sortea solo, con el modo del torneo,
  // para mostrar cómo quedarían. El resultado queda como borrador hasta confirmar.
  const { mutate: pedirSorteo } = sortear;
  const yaSorteado = useRef(false);
  useEffect(() => {
    if (!sorteable || zonas !== null || yaSorteado.current) return;
    yaSorteado.current = true;
    pedirSorteo({ modoDistribucion: sorteo.modoDistribucion });
  }, [sorteable, zonas, sorteo.modoDistribucion, pedirSorteo]);

  // Cambiar el modo reusa la siembra; volver a sortear también sortea de nuevo los empates.
  function repartir(modoDistribucion: ModoDistribucion, nuevaSiembra: boolean) {
    confirmar.reset();
    pedirSorteo({ modoDistribucion, nuevaSiembra });
  }

  function mover(jugadorId: number, grupo: string | null) {
    cargar.reset();
    setAsignacion((anterior) => {
      const nueva = { ...anterior };
      if (grupo === null) delete nueva[jugadorId];
      else nueva[jugadorId] = grupo;
      return nueva;
    });
  }

  function confirmarYPublicar() {
    sortear.reset();
    cargar.reset();
    if (!cargandoAMano) return confirmar.mutate();
    // Lo cargado a mano se guarda como borrador y recién ahí se confirma.
    const datos = { zonas: zonasManuales.map((z) => ({ grupo: z.grupo, jugadorIds: z.integrantes.map((j) => j.jugadorId) })) };
    cargar.mutate(datos, { onSuccess: () => confirmar.mutate() });
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-negro">
      <Encabezado sesion={sesion} />

      <div className="flex flex-wrap items-end justify-between gap-6 px-7 pt-[26px] pb-5">
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em]">Sorteo de zonas</h1>
          <p className="text-[15px] text-gris-500">
            <Numero>{sorteo.inscriptos}</Numero> inscriptos
            {/* Con la inscripción abierta todavía no se sabe cómo quedan las zonas. */}
            {(sorteable || zonas) && (
              <>
                {' '}
                · se arman <Numero>{sorteo.cantidadGrupos}</Numero> zonas de{' '}
                <TamanoDeZonas inscriptos={sorteo.inscriptos} grupos={sorteo.cantidadGrupos} />
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Numero className="flex h-9 items-center rounded-full border border-linea px-[13px] text-[13px]">
            {sorteo.nombre}
          </Numero>
          <span className="flex h-9 items-center rounded-full border border-linea px-[13px] font-mono text-[13px] text-gris-500">
            {sorteo.confirmado ? 'publicado' : 'todavía no publicado'}
          </span>
        </div>
      </div>

      <main className="flex flex-col gap-[22px] px-7 pb-5">
        <div className="grid gap-5 md:grid-cols-2">
          <TarjetaOpciones
            titulo="Cómo se reparten"
            aclaracion={sorteo.usaRanking ? 'usa el ranking vigente' : 'sin ranking, la siembra es al azar'}
            opciones={distribuciones.map((d) => ({ ...d, deshabilitada: !sorteable || ocupado || cargandoAMano }))}
            elegida={distribucion}
            alElegir={(modo) => {
              if (modo !== distribucion) repartir(modo, false);
            }}
            ayuda={ejecutor === 'manual' ? 'Cargado a mano, el reparto es el del sorteo presencial.' : ayudaDistribucion[distribucion]}
          />
          <TarjetaOpciones
            titulo="Quién lo ejecuta"
            aclaracion="podés revisarlo antes de publicar"
            opciones={ejecutores.map((e) => ({ ...e, deshabilitada: e.deshabilitada || !sorteable || ocupado }))}
            elegida={ejecutor}
            alElegir={setEjecutor}
            ayuda={ayudaEjecutor[ejecutor]}
          />
        </div>

        <section className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">{sorteo.confirmado ? 'Así quedaron' : 'Así quedarían'}</h2>
            {zonas && !cargandoAMano && <ResumenDeSumas zonas={zonas} />}
          </div>

          {cargandoAMano && sorteable ? (
            <CargaManual jugadores={sorteo.jugadores} zonas={zonasManuales} capacidad={mayor} alMover={mover} />
          ) : zonas ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {zonas.map((zona) => (
                <TarjetaZona key={zona.grupo} zona={zona} />
              ))}
            </div>
          ) : sorteo.estado === 'borrador' || sorteo.estado === 'publicado' ? (
            <p className="text-[15px] text-gris-500">La inscripción sigue abierta. El sorteo se hace cuando cierre.</p>
          ) : (
            !error && <p className="text-[15px] text-gris-500">Sorteando…</p>
          )}

          {error && <p className="text-sm text-rojo-texto">{textoDeError(error, sorteo)}</p>}

          {(zonas || cargandoAMano) && (
            <p className="text-sm text-gris-500">El número es la posición de siembra, según el ranking al momento del sorteo.</p>
          )}
        </section>
      </main>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-5 border-t border-linea px-7 py-[18px]">
        <div className="flex flex-col gap-1">
          {cargandoAMano && !cargaCompleta ? (
            <p className="text-[15px] font-semibold">
              {sinUbicar > 0 ? (
                <>
                  Faltan ubicar <Numero>{sinUbicar}</Numero> {sinUbicar === 1 ? 'jugador' : 'jugadores'}
                </>
              ) : (
                <>
                  La zona {zonaCorta?.grupo} tiene <Numero>{zonaCorta?.integrantes.length}</Numero>: todas necesitan al menos{' '}
                  <Numero>{minimoPorZona}</Numero>
                </>
              )}
            </p>
          ) : (
            (zonas || cargandoAMano) && (
              <p className="text-[15px] font-semibold">
                {sorteo.confirmado ? 'Se generaron' : 'Al confirmar se generan'}{' '}
                <Numero>{partidosDeZona(cargandoAMano ? zonasManuales : (zonas ?? []))}</Numero> partidos de zona
              </p>
            )
          )}
          <p className="text-sm text-gris-500">
            Los jugadores tienen <Numero>{sorteo.plazoGruposDias}</Numero> días para jugar la fase de grupos.
          </p>
        </div>
        {!sorteo.confirmado && (
          <div className="flex gap-2.5">
            {!cargandoAMano && (
              <Boton grande disabled={!sorteable || ocupado} onClick={() => repartir(distribucion, true)}>
                Volver a sortear
              </Boton>
            )}
            <Boton
              variante="principal"
              grande
              className="font-semibold"
              disabled={!sorteable || ocupado || (cargandoAMano ? !cargaCompleta : zonas === null)}
              onClick={confirmarYPublicar}
            >
              {cargar.isPending || confirmar.isPending ? 'Publicando…' : 'Confirmar y publicar'}
            </Boton>
          </div>
        )}
      </footer>
    </div>
  );
}
