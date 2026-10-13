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
        {zona.integrantes.map(({ jugadorId, posicionSiembra, apellido }) => (
          <li key={jugadorId} className="flex h-[34px] items-center gap-2.5">
            <Numero className="w-5 text-xs text-gris-400">{String(posicionSiembra).padStart(2, '0')}</Numero>
            <span className="truncate text-sm">{apellido}</span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
