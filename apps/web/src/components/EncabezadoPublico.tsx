import { Numero } from './Numero';

type Props = {
  organizacion: string;
  // Lo que se está mirando, al lado del nombre: "Copa Alta Barda 2026 · Tercera".
  detalle?: string;
};

// La marca de la organización arriba de las páginas públicas, que no tienen sesión ni menú.
export function EncabezadoPublico({ organizacion, detalle }: Props) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1">
      <div className="flex items-center gap-[9px]">
        <div className="flex size-[26px] items-center justify-center rounded-[7px] bg-negro">
          <div className="size-[9px] rounded-full bg-lima" />
        </div>
        <span className="text-base font-semibold tracking-[-0.015em]">{organizacion}</span>
      </div>
      {detalle && (
        <>
          <div className="hidden h-[18px] w-px bg-linea sm:block" />
          <Numero className="text-[13px] text-gris-500">{detalle}</Numero>
        </>
      )}
    </div>
  );
}
