import { Boton } from '../../components/Boton';
import { Tarjeta } from '../../components/Tarjeta';

type Opcion<T extends string> = {
  valor: T;
  etiqueta: string;
  // Se muestra pero no se puede elegir.
  deshabilitada?: boolean;
};

type Props<T extends string> = {
  titulo: string;
  aclaracion: string;
  opciones: Opcion<T>[];
  elegida: T;
  alElegir: (valor: T) => void;
  // Explica la consecuencia de la opción elegida.
  ayuda: string;
};

// Una decisión del sorteo: las opciones en fila, de las que se elige una.
export function TarjetaOpciones<T extends string>({ titulo, aclaracion, opciones, elegida, alElegir, ayuda }: Props<T>) {
  return (
    <Tarjeta className="flex flex-col gap-3 px-[18px] py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-[15px] font-semibold">{titulo}</h2>
        <span className="text-[13px] text-gris-500">{aclaracion}</span>
      </div>

      <div role="group" aria-label={titulo} className="flex flex-wrap gap-2">
        {opciones.map(({ valor, etiqueta, deshabilitada }) => {
          const activa = valor === elegida;
          return (
            <Boton
              key={valor}
              variante={activa ? 'organizador' : 'secundario'}
              aria-pressed={activa}
              disabled={deshabilitada}
              className={`text-sm ${activa ? 'font-semibold' : 'font-normal text-gris-700'}`}
              onClick={() => alElegir(valor)}
            >
              {etiqueta}
            </Boton>
          );
        })}
      </div>

      <p className="text-sm leading-[1.42] text-gris-500">{ayuda}</p>
    </Tarjeta>
  );
}
