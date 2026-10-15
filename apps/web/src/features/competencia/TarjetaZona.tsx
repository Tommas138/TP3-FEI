import type { ZonaSorteada } from '@setpoint/shared';
import { Numero } from '../../components/Numero';
import { Tarjeta } from '../../components/Tarjeta';
import { sumaDeSiembra } from './zonas';

export function TarjetaZona({ zona }: { zona: ZonaSorteada }) {
  return (
    <Tarjeta className="flex flex-col gap-1.5 px-[15px] py-[13px]">
      <div className="flex items-baseline justify-between gap-2.5 border-b border-linea-suave pb-[7px]">
        <h3 className="text-[15px] font-semibold">Zona {zona.grupo}</h3>
        <Numero className="text-xs text-gris-500">suma {sumaDeSiembra(zona)}</Numero>
      </div>

      <ul>
        {/* Cada jugador entra con una animación: al sortear de nuevo, se nota quién cambió de zona. */}
        {zona.integrantes.map(({ jugadorId, posicionSiembra, apellido }) => (
          <li key={jugadorId} className="flex h-[34px] items-center gap-2.5 motion-safe:animate-aparecer">
            <Numero className="w-5 text-xs text-gris-400">{String(posicionSiembra).padStart(2, '0')}</Numero>
            <span className="truncate text-sm">{apellido}</span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}

// La zona antes del primer sorteo: el lugar de cada jugador, todavía vacío. Mientras se sortea, late.
export function TarjetaZonaVacia({ grupo, lugares, sorteando }: { grupo: string; lugares: number; sorteando: boolean }) {
  return (
    <Tarjeta className="flex flex-col gap-1.5 px-[15px] py-[13px]" aria-hidden="true">
      <div className="flex items-baseline justify-between gap-2.5 border-b border-linea-suave pb-[7px]">
        <h3 className="text-[15px] font-semibold text-gris-400">Zona {grupo}</h3>
      </div>

      <ul className={sorteando ? 'motion-safe:animate-pulse' : ''}>
        {Array.from({ length: lugares }, (_, i) => (
          <li key={i} className="flex h-[34px] items-center gap-2.5">
            <span className="h-2.5 w-5 rounded-full bg-linea-suave" />
            <span className="h-2.5 w-24 rounded-full bg-linea-suave" />
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
