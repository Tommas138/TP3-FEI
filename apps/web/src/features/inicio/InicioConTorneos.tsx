import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boton } from '../../components/Boton';
import { IconoMas } from '../../components/IconoMas';
import { Numero } from '../../components/Numero';
import { AvisosAtencion } from './AvisosAtencion';
import { ListaBorradores } from './ListaBorradores';
import { ResumenOrganizacion } from './ResumenOrganizacion';
import { TablaTerminados } from './TablaTerminados';
import { TarjetaInscripcionAbierta } from './TarjetaInscripcionAbierta';
import { TarjetaParaSortear } from './TarjetaParaSortear';
import { TarjetaTorneoEnJuego } from './TarjetaTorneoEnJuego';
import type { TorneosDeInicio } from './torneosEjemplo';

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[11px]">
      <h2 className="text-[13px] font-semibold text-gris-500">{titulo}</h2>
      {children}
    </section>
  );
}

// Con torneos: agrupados por momento (en juego, para sortear, con inscripción abierta, en borrador,
// terminados), y a la derecha lo que pide atención.
export function InicioConTorneos({ torneos }: { torneos: TorneosDeInicio }) {
  const { borradores, enJuego, conInscripcionAbierta, paraSortear, terminados, totalTerminados, avisos } = torneos;
  const navegar = useNavigate();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6 px-7 pt-[26px] pb-[22px]">
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em]">Torneos</h1>
          <p className="text-[15px] text-gris-500">
            <Numero>{enJuego.length}</Numero> en juego · <Numero>{conInscripcionAbierta.length}</Numero> con la inscripción
            abierta
            {paraSortear.length > 0 && (
              <>
                {' '}
                · <Numero>{paraSortear.length}</Numero> para sortear
              </>
            )}
            {borradores.length > 0 && (
              <>
                {' '}
                · <Numero>{borradores.length}</Numero> en borrador
              </>
            )}
          </p>
        </div>
        <Boton variante="organizador" onClick={() => navegar('/torneos/nuevo')}>
          <IconoMas className="size-[13px] stroke-[2.6]" />
          Nuevo torneo
        </Boton>
      </div>

      <main className="grid items-start gap-[22px] px-7 pb-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-[22px]">
          {enJuego.length > 0 && (
            <Grupo titulo="En juego">
              {enJuego.map((torneo) => (
                <TarjetaTorneoEnJuego key={torneo.id} torneo={torneo} />
              ))}
            </Grupo>
          )}

          {/* Fuera de «Necesita tu atención»: ese bloque es rojo, y el rojo solo significa vencimiento. */}
          {paraSortear.length > 0 && (
            <Grupo titulo="Para sortear">
              <div className="grid gap-3.5 md:grid-cols-2">
                {paraSortear.map((torneo) => (
                  <TarjetaParaSortear key={torneo.id} torneo={torneo} />
                ))}
              </div>
            </Grupo>
          )}

          {conInscripcionAbierta.length > 0 && (
            <Grupo titulo="Inscripción abierta">
              <div className="grid gap-3.5 md:grid-cols-2">
                {conInscripcionAbierta.map((torneo) => (
                  <TarjetaInscripcionAbierta key={torneo.id} torneo={torneo} />
                ))}
              </div>
            </Grupo>
          )}

          {borradores.length > 0 && (
            <Grupo titulo="En borrador">
              <ListaBorradores torneos={borradores} />
            </Grupo>
          )}

          {terminados.length > 0 && (
            <Grupo titulo="Terminados">
              <TablaTerminados torneos={terminados} total={totalTerminados} />
            </Grupo>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {avisos.length > 0 && <AvisosAtencion avisos={avisos} />}

          <ResumenOrganizacion
            titulo="Tu circuito"
            filas={[
              { rotulo: 'Jugadores', valor: torneos.jugadores },
              { rotulo: 'Categorías', valor: torneos.categorias, variante: 'acento' },
              {
                rotulo: 'Recaudado en inscripciones abiertas',
                valor: `$${torneos.recaudadoEnInscripcionesAbiertas.toLocaleString('es-AR')}`,
                variante: 'importe',
              },
            ]}
            nota={
              torneos.usaRanking
                ? 'Ranking activo. Se actualiza al cerrar cada torneo.'
                : 'Ranking anual sin activar. Cada torneo termina con su propia tabla de posiciones.'
            }
          />
        </aside>
      </main>
    </>
  );
}
