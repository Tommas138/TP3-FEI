import type { SistemaDeJuego } from '@setpoint/shared';
import { Fragment, type InputHTMLAttributes } from 'react';
import { MensajeError } from '../torneos/MensajeError';
import { columnasDeLaGrilla, llevaTieBreak, type Problemas, type SetEscrito } from './resultado';

type Props = {
  sistema: SistemaDeJuego;
  nombres: [string, string];
  sets: SetEscrito[];
  problemas: Problemas;
  ganador: 'A' | 'B' | null;
  alCambiar: (columna: number, campo: keyof SetEscrito, valor: string) => void;
};

// Solo dígitos, como mucho dos: un super tie-break puede pasar de 10.
const soloDigitos = (valor: string) => valor.replace(/\D/g, '').slice(0, 2);

function CampoNumerico({ alCambiar, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { alCambiar: (valor: string) => void }) {
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      maxLength={2}
      onChange={(e) => alCambiar(soloDigitos(e.target.value))}
      className={`min-w-0 border border-gris-300 bg-white text-center font-mono font-medium tabular-nums outline-none focus:border-2 focus:border-negro ${className}`}
      {...props}
    />
  );
}

// Una fila por jugador y una columna por set, según el sistema de juego del torneo. En un set
// que queda 7-6 aparecen abajo los puntos del tie-break, que son opcionales (decisión 030).
export function GrillaDeSets({ sistema, nombres, sets, problemas, ganador, alCambiar }: Props) {
  const columnas = columnasDeLaGrilla(sistema);
  const conTieBreak = columnas.map((columna, i) => llevaTieBreak(sets[i], columna, sistema));
  const filaDeMensajes = conTieBreak.some(Boolean) ? 5 : 4;
  // La última columna, flexible, deja lugar a los mensajes del último set.
  const plantilla = ['minmax(0,200px)', ...columnas.map((c) => (c.esSuperTieBreak ? '118px' : '84px')), 'minmax(0,1fr)'].join(' ');

  // Cada mensaje va debajo de su set, en una fila propia: desde esa columna hasta el final.
  const mensajes = columnas.flatMap((_, i) =>
    [
      { id: `problema-set-${i}`, texto: problemas.sets[i] },
      { id: `problema-tie-break-${i}`, texto: problemas.tieBreaks[i] },
    ].flatMap(({ id, texto }) => (texto ? [{ id, texto, columna: i }] : [])),
  );
  const describe = (id: string) => (mensajes.some((m) => m.id === id) ? id : undefined);

  return (
    <div className="grid items-center gap-x-3.5 gap-y-2.5" style={{ gridTemplateColumns: plantilla }}>
      {nombres.map((nombre, j) => {
        const lado = j === 0 ? 'A' : 'B';
        const perdio = ganador !== null && ganador !== lado;
        return (
          <div key={lado} className="flex min-w-0 items-center gap-2.5" style={{ gridColumn: 1, gridRow: j + 2 }}>
            <span className={`size-[7px] shrink-0 rounded-full ${ganador === lado ? 'bg-lima' : 'bg-linea'}`} />
            <span className={`truncate text-lg ${perdio ? 'font-medium text-gris-700' : 'font-semibold'}`}>{nombre}</span>
          </div>
        );
      })}

      {conTieBreak.some(Boolean) && (
        <p className="text-[13px] text-gris-500" style={{ gridColumn: 1, gridRow: 4 }}>
          tie-break · opcional
        </p>
      )}

      {/* Cada set es una columna, y en el orden del documento van juntos los dos jugadores:
          así Tab recorre el marcador como se lee, 6-4 3-6 10-8. */}
      {columnas.map((columna, i) => {
        const set = sets[i];
        const campo = (gridRow: number) => ({ gridColumn: i + 2, gridRow });
        return (
          <Fragment key={i}>
            <span className="text-center font-mono text-xs text-gris-500" style={campo(1)}>
              {columna.rotulo}
            </span>
            {(['gamesA', 'gamesB'] as const).map((games, j) => (
              <CampoNumerico
                key={games}
                aria-label={`${columna.rotulo}, ${nombres[j]}`}
                aria-invalid={problemas.sets[i] !== null}
                aria-describedby={describe(`problema-set-${i}`)}
                value={set[games]}
                alCambiar={(valor) => alCambiar(i, games, valor)}
                className="h-14 w-full rounded-control text-[22px]"
                style={campo(j + 2)}
              />
            ))}
            {conTieBreak[i] && (
              <div className="flex items-center justify-between" style={campo(4)}>
                {(['tieBreakA', 'tieBreakB'] as const).map((puntos, j) => (
                  <Fragment key={puntos}>
                    {j === 1 && <span className="text-gris-400">-</span>}
                    <CampoNumerico
                      aria-label={`Tie-break del ${columna.rotulo}, ${nombres[j]}`}
                      aria-invalid={problemas.tieBreaks[i] !== null}
                      aria-describedby={describe(`problema-tie-break-${i}`)}
                      value={set[puntos]}
                      alCambiar={(valor) => alCambiar(i, puntos, valor)}
                      className="h-10 w-[37px] rounded-lg text-[15px]"
                    />
                  </Fragment>
                ))}
              </div>
            )}
          </Fragment>
        );
      })}

      {mensajes.map(({ id, texto, columna }, k) => (
        <div key={id} style={{ gridColumn: `${columna + 2} / -1`, gridRow: filaDeMensajes + k }}>
          <MensajeError id={id}>{texto}</MensajeError>
        </div>
      ))}

      {problemas.partido && (
        <div style={{ gridColumn: '1 / -1', gridRow: filaDeMensajes + mensajes.length }}>
          <MensajeError id="problema-partido">{problemas.partido}</MensajeError>
        </div>
      )}
    </div>
  );
}
