import type { FilaDeRanking, TorneoDelCalendario } from '@setpoint/shared';
import { useState } from 'react';
import { Numero } from '../../components/Numero';

type Props = {
  filas: FilaDeRanking[];
  torneosDelCalendario: TorneoDelCalendario[];
};

// "pri 25": las tres primeras letras del torneo del calendario y el año de los puntos.
function rotuloDeCasillero(nombre: string, anio: number) {
  return `${nombre.slice(0, 3).toLowerCase()} ${String(anio).slice(-2)}`;
}

// Puesto, nombre y total, sin scroll horizontal. Al tocar una fila se abre el desglose
// por torneo del calendario, como en la planilla.
export function TablaRanking({ filas, torneosDelCalendario }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <ul className="flex flex-col">
      {filas.map((fila) => {
        const estaAbierta = abierta === fila.jugadorId;
        return (
          <li key={fila.jugadorId} className="border-b border-linea-suave">
            <button
              type="button"
              aria-expanded={estaAbierta}
              onClick={() => setAbierta(estaAbierta ? null : fila.jugadorId)}
              className="grid h-14 w-full grid-cols-[26px_minmax(0,1fr)_58px] items-center gap-x-2.5 text-left"
            >
              <Numero className="text-sm text-gris-500">{fila.puesto}</Numero>
              <span className="truncate text-lg font-medium">
                {fila.nombre} {fila.apellido}
              </span>
              <Numero className="text-right text-lg font-medium">{fila.puntos}</Numero>
            </button>
            {estaAbierta && <Casilleros fila={fila} torneosDelCalendario={torneosDelCalendario} />}
          </li>
        );
      })}
    </ul>
  );
}

function Casilleros({ fila, torneosDelCalendario }: { fila: FilaDeRanking; torneosDelCalendario: TorneoDelCalendario[] }) {
  return (
    <div
      className="mb-3 grid gap-[5px]"
      style={{ gridTemplateColumns: `repeat(${Math.max(torneosDelCalendario.length, 1)}, minmax(0, 1fr))` }}
    >
      {torneosDelCalendario.map((torneo) => {
        const casillero = fila.casilleros.find((c) => c.etapaId === torneo.id);
        return (
          <div
            key={torneo.id}
            title={torneo.nombre}
            className="flex flex-col items-center gap-1 rounded-lg bg-fondo px-1 py-[9px]"
          >
            <Numero className="text-[10px] text-gris-500">
              {casillero ? rotuloDeCasillero(torneo.nombre, casillero.anio) : torneo.nombre.slice(0, 3).toLowerCase()}
            </Numero>
            <Numero className={`text-[17px] font-medium ${casillero ? 'text-negro' : 'text-gris-400'}`}>
              {casillero?.puntos ?? 0}
            </Numero>
          </div>
        );
      })}
    </div>
  );
}
