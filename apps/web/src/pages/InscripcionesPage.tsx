import type { InscripcionesDelTorneo } from '@setpoint/shared';
import type { ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Boton } from '../components/Boton';
import { EncabezadoOrganizador } from '../components/EncabezadoOrganizador';
import { Numero } from '../components/Numero';
import { leerSesion, type Sesion } from '../features/auth/sesion';
import { useCerrarSesion } from '../features/auth/useCerrarSesion';
import { useSesionInvalida } from '../features/auth/useSesionInvalida';
import { BarraDeLugares } from '../features/inscripciones/BarraDeLugares';
import { TablaInscriptos } from '../features/inscripciones/TablaInscriptos';
import { useCerrarInscripcion, useInscripciones } from '../features/inscripciones/useInscripciones';
import { iniciales, navegacionOrganizador } from '../features/organizador/encabezado';
import { diaConSemana } from '../features/torneos/texto';
import { ErrorApi } from '../lib/api';

// El mismo mínimo que usa el sorteo: con menos de 3 por zona no se sortea (decisión 015).
const MINIMO_POR_ZONA = 3;

// Versión mínima de F13: ver quiénes ocupan el cupo y cerrar la inscripción. Inscribir a mano,
// dar de baja, recordar el pago, la lista de espera y la conciliación llegan con F13 completa.
export function InscripcionesPage() {
  const sesion = leerSesion();
  const { id } = useParams();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  return <CargarInscripciones sesion={sesion} id={Number(id)} />;
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

function CargarInscripciones({ sesion, id }: { sesion: Sesion; id: number }) {
  const inscripciones = useInscripciones(sesion.organizacion.slug, id);
  const sesionInvalida = useSesionInvalida(inscripciones.error);
  const navegar = useNavigate();

  if (inscripciones.data) return <Inscripciones sesion={sesion} datos={inscripciones.data} />;

  const noExiste = inscripciones.error?.message === 'TORNEO_NO_ENCONTRADO';

  return (
    <div className="min-h-screen bg-white text-negro">
      <Encabezado sesion={sesion} />
      <div className="flex flex-col items-start gap-3 px-7 pt-[26px]">
        {noExiste ? (
          <>
            <p className="text-[15px] text-gris-500">No encontramos ese torneo.</p>
            <Boton onClick={() => navegar('/inicio')}>Volver al inicio</Boton>
          </>
        ) : inscripciones.error && !sesionInvalida ? (
          <>
            <p className="text-[15px] text-gris-500">No pudimos cargar las inscripciones.</p>
            <Boton onClick={() => void inscripciones.refetch()}>Probar de nuevo</Boton>
          </>
        ) : (
          <p className="text-[15px] text-gris-500">Cargando…</p>
        )}
      </div>
    </div>
  );
}

// 'AAAA-MM-DD' de hoy, en la hora de quien mira.
const hoy = () => new Intl.DateTimeFormat('en-CA').format(new Date());

// "cierra el viernes 26"
function textoDelCierre({ estado, cierreInscripcion }: InscripcionesDelTorneo) {
  if (estado === 'borrador') return 'todavía no se publicó';
  if (estado !== 'publicado') return 'inscripción cerrada';
  if (cierreInscripcion === null) return 'sin fecha de cierre';
  if (cierreInscripcion === hoy()) return 'cierra hoy';
  return cierreInscripcion > hoy()
    ? `cierra el ${diaConSemana(cierreInscripcion)}`
    : `la fecha de cierre era el ${diaConSemana(cierreInscripcion)}`;
}

// Lo que pasa al cerrar, dicho antes de que pase. Una vez cerrada, quiénes entran al sorteo.
function QuePasaAlCerrar({ datos, pagados, reservando }: { datos: InscripcionesDelTorneo; pagados: number; reservando: number }) {
  const reservas =
    reservando === 1 ? (
      'La reserva sin pagar'
    ) : (
      <>
        Las <Numero>{reservando}</Numero> reservas sin pagar
      </>
    );

  if (datos.estado === 'borrador') {
    return <p className="text-sm text-gris-500">La inscripción se abre cuando publiques el torneo.</p>;
  }

  if (datos.estado === 'publicado' && !datos.alcanzanParaLasZonas) {
    return (
      <p className="text-sm text-gris-700">
        Para armar <Numero>{datos.cantidadGrupos}</Numero> zonas hacen falta al menos{' '}
        <Numero>{datos.cantidadGrupos * MINIMO_POR_ZONA}</Numero> inscriptos que hayan pagado, y hay <Numero>{pagados}</Numero>.
        Para poder cerrar, esperá a que paguen más o{' '}
        <Link to={`/torneos/${datos.convocatoriaId}`} className="underline">
          bajá la cantidad de zonas del torneo
        </Link>
        .
      </p>
    );
  }

  if (datos.estado === 'publicado') {
    return (
      <p className="text-sm text-gris-500">
        Al cerrar, nadie más se puede inscribir y la categoría queda lista para sortear.
        {reservando > 0 && <> {reservas} {reservando === 1 ? 'no entra' : 'no entran'} al sorteo.</>}
      </p>
    );
  }

  if (datos.sorteoConfirmado) return <p className="text-sm text-gris-500">Las zonas ya se sortearon.</p>;

  if (datos.estado === 'inscripciones_cerradas') {
    return (
      <p className="text-sm text-gris-500">
        Entran al sorteo los <Numero>{pagados}</Numero> que pagaron.
        {reservando > 0 && <> {reservas} {reservando === 1 ? 'queda' : 'quedan'} afuera.</>}
      </p>
    );
  }

  return null;
}

function textoDeError(error: Error): ReactNode {
  const codigo = error instanceof ErrorApi ? error.codigo : '';
  switch (codigo) {
    case 'INSCRIPTOS_INSUFICIENTES':
      return 'Los que pagaron no alcanzan para las zonas del torneo.';
    case 'INSCRIPCION_NO_ABIERTA':
      return 'La inscripción ya estaba cerrada.';
    case 'SIN_CONEXION':
      return 'No hay conexión. Probá de nuevo.';
    default:
      return 'No se pudo cerrar. Probá de nuevo.';
  }
}

function Inscripciones({ sesion, datos }: { sesion: Sesion; datos: InscripcionesDelTorneo }) {
  const cerrar = useCerrarInscripcion(sesion.organizacion.slug, datos.torneoId);
  useSesionInvalida(cerrar.error);
  const navegar = useNavigate();

  const pagados = datos.inscripciones.filter((i) => i.estado === 'pagada').length;
  const reservando = datos.inscripciones.length - pagados;
  const irAlSorteo = () => navegar(`/torneos/${datos.torneoId}/sorteo`);

  return (
    <div className="flex min-h-screen flex-col bg-white text-negro">
      <Encabezado sesion={sesion} />

      <div className="flex flex-wrap items-end justify-between gap-6 px-7 pt-[26px] pb-5">
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em]">Inscripciones</h1>
          <p className="text-[15px] text-gris-500">
            {datos.nombre} · {textoDelCierre(datos)}
          </p>
        </div>

        {datos.estado === 'publicado' && (
          <Boton
            variante="organizador"
            className="font-semibold"
            disabled={!datos.alcanzanParaLasZonas || cerrar.isPending}
            onClick={() => cerrar.mutate()}
          >
            {cerrar.isPending ? 'Cerrando…' : 'Cerrar inscripciones'}
          </Boton>
        )}
        {datos.estado === 'inscripciones_cerradas' && !datos.sorteoConfirmado && (
          <Boton variante="organizador" className="font-semibold" onClick={irAlSorteo}>
            Sortear zonas
          </Boton>
        )}
        {datos.sorteoConfirmado && <Boton onClick={irAlSorteo}>Ver zonas</Boton>}
      </div>

      <main className="flex flex-col gap-[22px] px-7 pb-7">
        <section className="flex flex-col gap-3">
          <BarraDeLugares cupo={datos.cupo} pagados={pagados} reservando={reservando} />
          <QuePasaAlCerrar datos={datos} pagados={pagados} reservando={reservando} />
          {cerrar.error && <p className="text-sm text-rojo-texto">{textoDeError(cerrar.error)}</p>}
        </section>

        <TablaInscriptos inscripciones={datos.inscripciones} />
      </main>
    </div>
  );
}
