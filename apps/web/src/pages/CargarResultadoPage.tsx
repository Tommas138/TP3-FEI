import type { PartidoConResultado } from '@setpoint/shared';
import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Boton } from '../components/Boton';
import { Chip } from '../components/Chip';
import { EncabezadoOrganizador } from '../components/EncabezadoOrganizador';
import { Numero } from '../components/Numero';
import { Tarjeta } from '../components/Tarjeta';
import { leerSesion, type Sesion } from '../features/auth/sesion';
import { useCerrarSesion } from '../features/auth/useCerrarSesion';
import { useSesionInvalida } from '../features/auth/useSesionInvalida';
import { iniciales, navegacionOrganizador } from '../features/organizador/encabezado';
import { AlGuardar, TextoConNumeros } from '../features/resultados/AlGuardar';
import { GrillaDeSets } from '../features/resultados/GrillaDeSets';
import {
  cambiaUnGanadorQueYaJugo,
  cargaDelPartido,
  leerCarga,
  nombresDelPartido,
  primeroSinResultado,
  resumenDelResultado,
  rotuloDelPartido,
  tieneResultado,
  textoDelError,
  ubicacionDelPartido,
  type Carga,
  type SetEscrito,
  type TipoDeResultado,
} from '../features/resultados/resultado';
import { SelectorDePartido } from '../features/resultados/SelectorDePartido';
import { useGuardarResultado, usePartido, usePartidos, useSimulacion } from '../features/resultados/useResultado';

// Sin partido en la ruta, se abre el primero que no tiene resultado (decisión 031).
export function CargarResultadoPage() {
  const sesion = leerSesion();
  const { id, partidoId } = useParams();
  if (!sesion) return <Navigate to="/ingresar" replace />;
  if (partidoId === undefined) return <PrimeroSinResultado sesion={sesion} torneoId={Number(id)} />;
  // Con la key, cambiar de partido arranca la carga de cero.
  return <CargarResultado key={partidoId} sesion={sesion} torneoId={Number(id)} partidoId={Number(partidoId)} />;
}

function Marco({ sesion, children }: { sesion: Sesion; children: ReactNode }) {
  const cerrarSesion = useCerrarSesion();
  return (
    <div className="min-h-screen bg-fondo-tabla text-negro">
      <EncabezadoOrganizador
        organizacion={sesion.organizacion.nombre}
        navegacion={navegacionOrganizador}
        iniciales={iniciales(sesion.usuario.nombre)}
        alSalir={cerrarSesion}
      />
      <div className="flex justify-center px-7 pt-[34px] pb-10">
        <div className="flex w-full max-w-[720px] flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

// Hasta que exista el tablero (F15), la edición lleva al Sorteo de zonas, que es desde donde se entra.
function Migas({ torneoId, nombre, ubicacion }: { torneoId: number; nombre: string; ubicacion?: string }) {
  const separador = (
    <span aria-hidden="true" className="text-gris-300">
      /
    </span>
  );
  return (
    <nav aria-label="Migas" className="flex flex-wrap items-center gap-[9px] text-sm">
      <Link to={`/torneos/${torneoId}/sorteo`} className="text-gris-500 hover:text-negro">
        <Numero>{nombre}</Numero>
      </Link>
      {ubicacion && (
        <>
          {separador}
          <span className="text-gris-500">{ubicacion}</span>
        </>
      )}
      {separador}
      <span aria-current="page" className="font-semibold">
        Cargar resultado
      </span>
    </nav>
  );
}

function Estado({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-start gap-3">{children}</div>;
}

function PrimeroSinResultado({ sesion, torneoId }: { sesion: Sesion; torneoId: number }) {
  const slug = sesion.organizacion.slug;
  const partidos = usePartidos(slug, torneoId);
  const sesionInvalida = useSesionInvalida(partidos.error);
  const navegar = useNavigate();

  if (partidos.data) {
    const primero = primeroSinResultado(partidos.data.partidos);
    if (primero) return <Navigate to={`/torneos/${torneoId}/resultados/${primero.id}`} replace />;
    return (
      <Marco sesion={sesion}>
        <Migas torneoId={torneoId} nombre={partidos.data.nombre} />
        <Tarjeta className="overflow-hidden">
          <div className="flex flex-col gap-[5px] border-b border-linea px-6 py-5">
            <h1 className="text-[22px] font-semibold tracking-[-0.03em]">No falta cargar ningún resultado</h1>
            <p className="text-sm text-gris-500">Si tenés que corregir uno, elegí el partido.</p>
          </div>
          <SelectorDePartido slug={slug} torneoId={torneoId} />
        </Tarjeta>
      </Marco>
    );
  }

  return (
    <Marco sesion={sesion}>
      <Estado>
        {partidos.error?.message === 'TORNEO_NO_ENCONTRADO' ? (
          <>
            <p className="text-[15px] text-gris-500">No encontramos ese torneo.</p>
            <Boton onClick={() => navegar('/inicio')}>Volver al inicio</Boton>
          </>
        ) : partidos.error && !sesionInvalida ? (
          <>
            <p className="text-[15px] text-gris-500">No pudimos cargar los partidos.</p>
            <Boton onClick={() => void partidos.refetch()}>Probar de nuevo</Boton>
          </>
        ) : (
          <p className="text-[15px] text-gris-500">Cargando…</p>
        )}
      </Estado>
    </Marco>
  );
}

function CargarResultado({ sesion, torneoId, partidoId }: { sesion: Sesion; torneoId: number; partidoId: number }) {
  const partido = usePartido(sesion.organizacion.slug, torneoId, partidoId);
  const sesionInvalida = useSesionInvalida(partido.error);
  const navegar = useNavigate();

  if (partido.data) return <TarjetaDelPartido sesion={sesion} partido={partido.data} />;

  const noExiste = partido.error?.message === 'PARTIDO_NO_ENCONTRADO' || partido.error?.message === 'TORNEO_NO_ENCONTRADO';
  return (
    <Marco sesion={sesion}>
      <Estado>
        {noExiste ? (
          <>
            <p className="text-[15px] text-gris-500">No encontramos ese partido.</p>
            <Boton onClick={() => navegar('/inicio')}>Volver al inicio</Boton>
          </>
        ) : partido.error && !sesionInvalida ? (
          <>
            <p className="text-[15px] text-gris-500">No pudimos cargar el partido.</p>
            <Boton onClick={() => void partido.refetch()}>Probar de nuevo</Boton>
          </>
        ) : (
          <p className="text-[15px] text-gris-500">Cargando…</p>
        )}
      </Estado>
    </Marco>
  );
}

function ElegirGanador({
  pregunta,
  partido,
  elegido,
  alElegir,
}: {
  pregunta: string;
  partido: PartidoConResultado;
  elegido: number | null;
  alElegir: (jugadorId: number) => void;
}) {
  const nombres = nombresDelPartido(partido);
  const jugadores = [partido.jugadorA!, partido.jugadorB!];
  return (
    <div className="flex flex-col gap-2.5">
      <p id="pregunta-ganador" className="text-[15px] font-semibold">
        {pregunta}
      </p>
      <div role="group" aria-labelledby="pregunta-ganador" className="flex flex-wrap gap-2">
        {jugadores.map(({ jugadorId }, i) => (
          <Chip key={jugadorId} activo={elegido === jugadorId} onClick={() => alElegir(jugadorId)}>
            {nombres[i]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function TarjetaDelPartido({ sesion, partido }: { sesion: Sesion; partido: PartidoConResultado }) {
  const slug = sesion.organizacion.slug;
  const { torneoId } = partido;
  const navegar = useNavigate();
  const guardar = useGuardarResultado(slug, torneoId, partido.id);
  const partidos = usePartidos(slug, torneoId);
  useSesionInvalida(guardar.error);

  const [eligiendo, setEligiendo] = useState(false);
  const [carga, setCarga] = useState<Carga>(() => cargaDelPartido(partido));

  // Un partido de cuadro sin sus dos jugadores, o cancelado, no lleva resultado todavía.
  const sinCarga =
    partido.jugadorA === null || partido.jugadorB === null
      ? 'Este partido todavía no tiene a sus dos jugadores: espera a los ganadores de la ronda anterior.'
      : partido.estado === 'cancelada'
        ? 'Este partido se canceló: no lleva resultado.'
        : null;

  const nombres = nombresDelPartido(partido);
  const lectura = leerCarga(carga, partido);
  // La vista previa de una zona la calcula la API; la de un cuadro, la web (decisión 032).
  const simulacion = useSimulacion(slug, torneoId, partido.id, partido.fase === 'grupos' && !sinCarga ? lectura.datos : null);
  // Con las zonas cerradas, una corrección que cambia los cuadros no se guarda (decisión 028).
  const cambiaLosCuadros = simulacion.data?.cambiaLosCuadros === true && !simulacion.desactualizada;
  const siguienteYaJugado = lectura.datos !== null && cambiaUnGanadorQueYaJugo(lectura.datos, partido, partidos.data?.partidos ?? []);
  const corrigiendo = tieneResultado(partido);
  // Se compara lo que se mandaría: si es lo mismo que ya está guardado, no hay nada que corregir.
  const cambio = JSON.stringify(lectura.datos) !== JSON.stringify(leerCarga(cargaDelPartido(partido), partido).datos);
  const resumen = lectura.datos && resumenDelResultado(lectura.datos, partido);
  const recienGuardado = guardar.isSuccess && !cambio;
  const siguiente = primeroSinResultado(partidos.data?.partidos.filter((p) => p.id !== partido.id) ?? []);

  function cambiar(nueva: Partial<Carga>) {
    guardar.reset();
    setCarga((anterior) => ({ ...anterior, ...nueva }));
  }

  function cambiarSet(columna: number, campo: keyof SetEscrito, valor: string) {
    cambiar({ sets: carga.sets.map((set, i) => (i === columna ? { ...set, [campo]: valor } : set)) });
  }

  // Tocar el tipo elegido vuelve a un partido jugado.
  function alternarTipo(tipo: TipoDeResultado) {
    cambiar({ tipo: carga.tipo === tipo ? 'jugado' : tipo });
  }

  return (
    <Marco sesion={sesion}>
      <Migas torneoId={torneoId} nombre={partido.nombre} ubicacion={ubicacionDelPartido(partido)} />

      <Tarjeta className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-linea px-6 py-5">
          <div className="flex flex-col gap-[5px]">
            <h1 className="text-[22px] font-semibold tracking-[-0.03em]">
              {nombres[0]} · {nombres[1]}
            </h1>
            <p className="font-mono text-[13px] text-gris-500">{rotuloDelPartido(partido)}</p>
          </div>
          <Boton aria-expanded={eligiendo} onClick={() => setEligiendo(!eligiendo)}>
            {eligiendo ? 'Volver al partido' : 'Cambiar partido'}
          </Boton>
        </div>

        {eligiendo ? (
          <SelectorDePartido slug={slug} torneoId={torneoId} actual={partido.id} />
        ) : sinCarga ? (
          <p className="px-6 py-5 text-[15px] text-gris-500">{sinCarga}</p>
        ) : (
          <>
            <div className="flex flex-col gap-4 px-6 pt-6 pb-5">
              {carga.tipo === 'walkover' ? (
                <ElegirGanador
                  pregunta="¿Quién ganó?"
                  partido={partido}
                  elegido={carga.ganadorId}
                  alElegir={(ganadorId) => cambiar({ ganadorId })}
                />
              ) : (
                <GrillaDeSets
                  sistema={partido.sistema}
                  nombres={nombres}
                  sets={carga.sets}
                  problemas={lectura.problemas}
                  ganador={lectura.ganador}
                  alCambiar={cambiarSet}
                />
              )}

              {carga.tipo === 'abandono' && (
                <ElegirGanador
                  pregunta="¿Quién siguió jugando?"
                  partido={partido}
                  elegido={carga.ganadorId}
                  alElegir={(ganadorId) => cambiar({ ganadorId })}
                />
              )}

              {resumen && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-lima-tenue px-4 py-3">
                  <span className="size-2 shrink-0 rounded-full bg-lima" />
                  <p className="text-[15px] font-semibold">
                    <TextoConNumeros frase={resumen.titulo} />
                  </p>
                  {resumen.detalle && <p className="font-mono text-[13px] text-gris-500">{resumen.detalle}</p>}
                </div>
              )}

              <div role="group" aria-label="Otro tipo de resultado" className="flex flex-wrap gap-[9px]">
                <Chip activo={carga.tipo === 'walkover'} onClick={() => alternarTipo('walkover')}>
                  Fue walkover
                </Chip>
                <Chip activo={carga.tipo === 'abandono'} onClick={() => alternarTipo('abandono')}>
                  Hubo abandono
                </Chip>
              </div>
            </div>

            <AlGuardar partido={partido} datos={lectura.datos} simulacion={simulacion} siguienteYaJugado={siguienteYaJugado} />

            <div className="flex items-center justify-between gap-4 border-t border-linea px-6 py-[18px]">
              {guardar.error ? (
                <p className="min-w-0 flex-1 text-sm text-rojo-texto">{textoDelError(guardar.error)}</p>
              ) : recienGuardado ? (
                <p className="min-w-0 flex-1 text-[15px] font-semibold">
                  {siguiente ? 'Resultado guardado.' : 'Resultado guardado. No falta cargar ningún otro.'}
                </p>
              ) : (
                <p className="min-w-0 flex-1 text-sm text-gris-500">
                  Podés corregirlo después, mientras no cambie a quién ya se ubicó en los cuadros.
                </p>
              )}
              <div className="flex shrink-0 gap-2.5">
                <Boton onClick={() => navegar(`/torneos/${torneoId}/sorteo`)}>{recienGuardado ? 'Volver al sorteo' : 'Cancelar'}</Boton>
                {recienGuardado && siguiente ? (
                  <Boton
                    variante="organizador"
                    className="font-semibold"
                    onClick={() => navegar(`/torneos/${torneoId}/resultados/${siguiente.id}`)}
                  >
                    Cargar el siguiente partido
                  </Boton>
                ) : (
                  <Boton
                    variante="organizador"
                    className="font-semibold"
                    disabled={
                      lectura.datos === null || (corrigiendo && !cambio) || cambiaLosCuadros || siguienteYaJugado || guardar.isPending
                    }
                    onClick={() => lectura.datos && guardar.mutate(lectura.datos)}
                  >
                    {guardar.isPending ? 'Guardando…' : corrigiendo ? 'Guardar corrección' : 'Guardar resultado'}
                  </Boton>
                )}
              </div>
            </div>
          </>
        )}
      </Tarjeta>
    </Marco>
  );
}
