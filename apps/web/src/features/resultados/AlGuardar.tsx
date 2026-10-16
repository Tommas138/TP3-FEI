import type { DatosResultado, PartidoConResultado, SimulacionDeResultado } from '@setpoint/shared';
import type { ReactNode } from 'react';
import { Numero } from '../../components/Numero';
import {
  CAMBIA_LOS_CUADROS,
  SIGUIENTE_YA_JUGADO,
  textoDelError,
  vistaPreviaDeLaZona,
  vistaPreviaDelCuadro,
  type Frase,
} from './resultado';

// Los números van en mono (design.md §4).
export function TextoConNumeros({ frase }: { frase: Frase }) {
  return frase.map((parte, i) => (typeof parte === 'number' ? <Numero key={i}>{parte}</Numero> : parte));
}

type Props = {
  partido: PartidoConResultado;
  // null mientras la grilla no forme un resultado válido.
  datos: DatosResultado | null;
  // Solo en un partido de zona: la tabla que calculó la API.
  simulacion: { data?: SimulacionDeResultado; error: Error | null; desactualizada: boolean };
  // Solo en un partido de cuadro: la corrección cambia un ganador que ya jugó el partido siguiente.
  siguienteYaJugado: boolean;
};

function Lineas({ lineas }: { lineas: Frase[] }) {
  return (
    <ul className="flex flex-col gap-[7px]">
      {lineas.map((linea, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px]">
          <span className="mt-[9px] size-[5px] shrink-0 rounded-full bg-negro" />
          <span>
            <TextoConNumeros frase={linea} />
          </span>
        </li>
      ))}
    </ul>
  );
}

const ayuda = (texto: string) => <p className="text-[15px] text-gris-500">{texto}</p>;

// Antes de guardar, la pantalla dice quién queda dónde y a qué cuadro va (design.md §2,
// principio 4). En una zona lo calcula la API sin guardar nada (decisión 032); en un cuadro
// alcanza con la ronda.
export function AlGuardar({ partido, datos, simulacion, siguienteYaJugado }: Props) {
  const deZona = partido.fase === 'grupos';
  let contenido: ReactNode;

  if (datos === null) {
    contenido = ayuda(deZona ? 'Completá el resultado para ver cómo queda la zona.' : 'Completá el resultado para ver quién avanza.');
  } else if (!deZona) {
    contenido = siguienteYaJugado ? (
      <p className="text-sm text-rojo-texto">{SIGUIENTE_YA_JUGADO}</p>
    ) : (
      <Lineas lineas={vistaPreviaDelCuadro(datos, partido)} />
    );
  } else if (simulacion.error && !simulacion.desactualizada) {
    contenido = (
      <p className="text-sm text-rojo-texto">{textoDelError(simulacion.error, 'No pudimos calcular cómo queda la zona. Probá de nuevo.')}</p>
    );
  } else if (!simulacion.data) {
    contenido = ayuda('Calculando cómo queda la zona…');
  } else {
    // Mientras llega la tabla nueva, la anterior se ve apagada.
    contenido = (
      <div aria-busy={simulacion.desactualizada} className={`flex flex-col gap-2.5 ${simulacion.desactualizada ? 'opacity-50' : ''}`}>
        <Lineas lineas={vistaPreviaDeLaZona(simulacion.data, datos, partido)} />
        {simulacion.data.cambiaLosCuadros && <p className="text-sm text-rojo-texto">{CAMBIA_LOS_CUADROS}</p>}
      </div>
    );
  }

  return (
    <section aria-labelledby="al-guardar" className="flex flex-col gap-2.5 border-t border-linea bg-fondo-tabla px-6 py-[18px]">
      <h2 id="al-guardar" className="text-[13px] font-semibold text-gris-500">
        Al guardar
      </h2>
      {contenido}
    </section>
  );
}
