import type { ZonaSorteada } from '@setpoint/shared';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Numero } from '../../components/Numero';

// Modo asistido: el sorteo en pantalla completa, para proyectarlo durante la reunión. El
// servidor ya sorteó todo; acá se revela de a un jugador, bombo por bombo (decisión 021).

const SEGUNDOS_POR_JUGADOR = 1.5;

type Props = {
  nombre: string;
  // null mientras se sortea.
  zonas: ZonaSorteada[] | null;
  cantidadGrupos: number;
  // Cada vez que se vuelve a sortear cambia, y la revelación arranca de cero.
  ronda: number;
  error: ReactNode;
  alVolverASortear: () => void;
  alCerrar: () => void;
};

export function SorteoEnPantalla({ nombre, zonas, cantidadGrupos, ronda, error, alVolverASortear, alCerrar }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);

  // Pantalla completa si el navegador la permite; si no, igual tapa toda la página. Salir de la
  // pantalla completa no corta el sorteo: se cierra con «Cerrar» o con Escape.
  useEffect(() => {
    contenedor.current?.requestFullscreen?.().catch(() => {});
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') alCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [alCerrar]);

  return (
    <div
      ref={contenedor}
      role="dialog"
      aria-modal="true"
      aria-label="Sorteo en pantalla"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-negro text-white"
    >
      <div className="flex items-center justify-between gap-6 px-10 pt-8">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-sm text-gris-400">sorteo de zonas</p>
          <Numero className="text-xl font-semibold">{nombre}</Numero>
        </div>
        <BotonOscuro onClick={alCerrar}>Cerrar</BotonOscuro>
      </div>

      {zonas ? (
        <Revelacion
          key={ronda}
          zonas={zonas}
          cantidadGrupos={cantidadGrupos}
          alVolverASortear={alVolverASortear}
          alCerrar={alCerrar}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-10">
          {error ? <p className="text-lg text-gris-400">{error}</p> : <p className="text-3xl text-gris-400">Sorteando…</p>}
          {error && <BotonOscuro onClick={alVolverASortear}>Probar de nuevo</BotonOscuro>}
        </div>
      )}
    </div>
  );
}

type PropsRevelacion = {
  zonas: ZonaSorteada[];
  cantidadGrupos: number;
  alVolverASortear: () => void;
  alCerrar: () => void;
};

function Revelacion({ zonas, cantidadGrupos, alVolverASortear, alCerrar }: PropsRevelacion) {
  // El orden en que salen: por siembra, así cada bombo sale completo antes que el siguiente.
  const salidas = zonas
    .flatMap((zona) => zona.integrantes.map((integrante) => ({ grupo: zona.grupo, ...integrante })))
    .sort((a, b) => a.posicionSiembra - b.posicionSiembra);

  const [revelados, setRevelados] = useState(0);
  const [pausado, setPausado] = useState(false);
  const terminado = revelados >= salidas.length;

  useEffect(() => {
    if (pausado || terminado) return;
    const espera = setTimeout(() => setRevelados((n) => n + 1), revelados === 0 ? 600 : SEGUNDOS_POR_JUGADOR * 1000);
    return () => clearTimeout(espera);
  }, [revelados, pausado, terminado]);

  const ultimo = revelados > 0 ? salidas[revelados - 1] : null;
  const visibles = new Set(salidas.slice(0, revelados).map((s) => s.jugadorId));
  const bombo = (posicion: number) => Math.floor((posicion - 1) / cantidadGrupos) + 1;

  return (
    <>
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-10 py-8 text-center" aria-live="polite">
        {ultimo ? (
          <div key={ultimo.jugadorId} className="flex flex-col items-center gap-3 motion-safe:animate-aparecer">
            <p className="font-mono text-sm text-gris-400">
              bombo {bombo(ultimo.posicionSiembra)}
              {bombo(ultimo.posicionSiembra) === 1 && ' · cabezas de serie'} · siembra {ultimo.posicionSiembra}
            </p>
            <p className="text-[56px] leading-none font-semibold tracking-[-0.035em]">
              {ultimo.nombre} {ultimo.apellido}
            </p>
            <p className="text-2xl text-gris-400">
              a la zona <span className="font-mono text-[40px] font-semibold text-lima">{ultimo.grupo}</span>
            </p>
          </div>
        ) : (
          <p className="text-3xl text-gris-400">Empieza el sorteo</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 px-10 lg:grid-cols-4">
        {zonas.map((zona) => (
          <div key={zona.grupo} className="flex flex-col gap-1.5 rounded-tarjeta border border-borde-oscuro bg-carbon px-[15px] py-[13px]">
            <h3 className="border-b border-borde-oscuro pb-[7px] text-[15px] font-semibold">Zona {zona.grupo}</h3>
            <ul>
              {zona.integrantes.map((integrante) => (
                <li key={integrante.jugadorId} className="flex h-[34px] items-center gap-2.5">
                  {visibles.has(integrante.jugadorId) ? (
                    <span className="flex items-center gap-2.5 motion-safe:animate-aparecer">
                      <Numero className="w-5 text-xs text-gris-400">{String(integrante.posicionSiembra).padStart(2, '0')}</Numero>
                      <span className="truncate text-sm">{integrante.apellido}</span>
                    </span>
                  ) : (
                    <span className="h-px w-16 bg-borde-oscuro" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 px-10 py-8">
        <p className="text-sm text-gris-400">
          <Numero>{Math.min(revelados, salidas.length)}</Numero> de <Numero>{salidas.length}</Numero> jugadores
        </p>
        <div className="flex gap-2.5">
          {terminado ? (
            <>
              <BotonOscuro onClick={alVolverASortear}>Volver a sortear</BotonOscuro>
              <button
                type="button"
                onClick={alCerrar}
                className="inline-flex h-12 items-center rounded-control bg-lima px-5 text-[15px] font-semibold text-negro"
              >
                Listo, revisar y confirmar
              </button>
            </>
          ) : (
            <>
              <BotonOscuro onClick={() => setPausado((p) => !p)}>{pausado ? 'Seguir' : 'Pausar'}</BotonOscuro>
              <BotonOscuro onClick={() => setRevelados(salidas.length)}>Mostrar todo</BotonOscuro>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Botón sobre fondo negro: transparente con borde oscuro (design.md).
function BotonOscuro({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center rounded-control border border-borde-oscuro px-5 text-[15px] font-medium text-white hover:bg-carbon"
    >
      {children}
    </button>
  );
}
