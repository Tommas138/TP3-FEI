import { Numero } from '../../components/Numero';
import { Tarjeta } from '../../components/Tarjeta';

type Props = {
  cupo: number;
  pagados: number;
  reservando: number;
};

// La barra de marcas de design.md §6: una marca por lugar del cupo.
export function BarraDeLugares({ cupo, pagados, reservando }: Props) {
  const libres = Math.max(0, cupo - pagados - reservando);
  const tramos = [
    { cantidad: pagados, rotulo: 'pagados', color: 'bg-negro' },
    { cantidad: reservando, rotulo: 'reservando', color: 'bg-gris-400' },
    { cantidad: libres, rotulo: 'libres', color: 'bg-linea' },
  ];

  return (
    <Tarjeta className="flex flex-col gap-3.5 px-5 pt-[18px] pb-4">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <p className="text-[15px] font-semibold">
          <Numero>{cupo}</Numero> lugares
        </p>
        <ul className="flex flex-wrap items-center gap-[18px]">
          {tramos.map(({ cantidad, rotulo, color }) => (
            <li key={rotulo} className="flex items-center gap-[7px]">
              <span className={`size-[9px] rounded-[2px] ${color}`} />
              <Numero className="text-[13px]">{cantidad}</Numero>
              <span className="text-[13px] text-gris-500">{rotulo}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* Los números ya están en la leyenda: las marcas son solo el dibujo. */}
      <div aria-hidden className="flex gap-[3px]">
        {tramos.flatMap(({ cantidad, rotulo, color }) =>
          Array.from({ length: cantidad }, (_, i) => (
            <span key={`${rotulo}-${i}`} className={`h-[30px] flex-1 rounded-[3px] ${color}`} />
          )),
        )}
      </div>
    </Tarjeta>
  );
}
