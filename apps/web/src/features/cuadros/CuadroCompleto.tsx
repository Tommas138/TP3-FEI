import type { CuadroEliminatorio, PartidoDelCuadro } from '@setpoint/shared';
import { Numero } from '../../components/Numero';
import { NOMBRE_DEL_CUADRO, destacadoDe, lugaresDeLaRonda, partidosJugados, rotuloDeRonda } from './cuadro';
import { TarjetaPartido } from './TarjetaPartido';

// Medidas del cuadro de design.md §6: tarjetas de 190 y, entre columnas, 17 de codo y 17 de conector.
const ANCHO_TARJETA = 190;
const SEPARACION = 34;
const ALTO_POR_LUGAR = 74;

// Nombre del cuadro y cuántos partidos van. El principal lleva el punto lima y la regla negra.
export function EncabezadoDelCuadro({ cuadro }: { cuadro: CuadroEliminatorio }) {
  const principal = cuadro.cuadro === 'campeonato';
  return (
    <div className={`flex items-center justify-between gap-3 border-b-2 pb-3 ${principal ? 'border-negro' : 'border-linea'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`size-[9px] rounded-full ${principal ? 'bg-lima' : 'bg-linea'}`} />
        <h2 className="text-xl font-semibold tracking-[-0.025em]">{NOMBRE_DEL_CUADRO[cuadro.cuadro]}</h2>
      </div>
      <Numero className="text-[13px] text-gris-500">
        {partidosJugados(cuadro)} de {cuadro.partidos.length} jugados
      </Numero>
    </div>
  );
}

// El cuadro completo, una columna por ronda. Las columnas tienen todas la misma altura y cada par
// de lugares se reparte con space-around: así cada partido queda a la altura de los dos que lo
// alimentan, y los codos son bordes de 1px (design.md §12).
export function CuadroCompleto({ cuadro }: { cuadro: CuadroEliminatorio }) {
  const rondas = Array.from({ length: cuadro.rondas }, (_, i) => i + 1);
  const columnas = { gridTemplateColumns: `repeat(${cuadro.rondas}, ${ANCHO_TARJETA}px)`, columnGap: SEPARACION };
  const alto = Math.max(2 ** (cuadro.rondas - 1) * ALTO_POR_LUGAR, 150);

  return (
    <section className="flex flex-col gap-4" style={{ width: cuadro.rondas * ANCHO_TARJETA + (cuadro.rondas - 1) * SEPARACION }}>
      <EncabezadoDelCuadro cuadro={cuadro} />

      <div className="grid" style={columnas}>
        {rondas.map((ronda) => (
          <Numero key={ronda} className="text-xs text-gris-500">
            {rotuloDeRonda(ronda, cuadro.rondas)}
          </Numero>
        ))}
      </div>

      <div className="grid" style={columnas}>
        {rondas.map((ronda) => {
          const lugares = lugaresDeLaRonda(cuadro, ronda);
          if (lugares.length === 1) {
            return (
              <div key={ronda} className="flex flex-col justify-center" style={{ height: alto }}>
                <Lugar partido={lugares[0]} cuadro={cuadro} />
              </div>
            );
          }
          const pares = Array.from({ length: lugares.length / 2 }, (_, i) => [lugares[2 * i], lugares[2 * i + 1]] as const);
          return (
            <div key={ronda} className="flex flex-col" style={{ height: alto }}>
              {pares.map(([arriba, abajo], i) => (
                <div key={i} className={`relative flex flex-1 flex-col justify-around ${codo(arriba !== null, abajo !== null)}`}>
                  <Lugar partido={arriba} cuadro={cuadro} />
                  <Lugar partido={abajo} cuadro={cuadro} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const CODO = "after:absolute after:-right-[17px] after:w-[17px] after:border-linea after:content-['']";

// El codo que une un par con el partido siguiente. Si un lugar quedó vacío por un bye, el codo
// sale solo del partido que hay.
function codo(hayArriba: boolean, hayAbajo: boolean) {
  if (hayArriba && hayAbajo) return `${CODO} after:inset-y-1/4 after:rounded-r-lg after:border-y after:border-r`;
  if (hayArriba) return `${CODO} after:top-1/4 after:bottom-1/2 after:rounded-tr-lg after:border-t after:border-r`;
  if (hayAbajo) return `${CODO} after:top-1/2 after:bottom-1/4 after:rounded-br-lg after:border-b after:border-r`;
  return '';
}

// Un lugar del cuadro. Desde la segunda ronda, cada partido lleva el conector que llega del codo.
function Lugar({ partido, cuadro }: { partido: PartidoDelCuadro | null; cuadro: CuadroEliminatorio }) {
  if (!partido) return <div className="h-16" aria-hidden />;
  const conector =
    partido.ronda > 1 ? "before:absolute before:top-1/2 before:-left-[17px] before:h-px before:w-[17px] before:bg-linea before:content-['']" : '';
  return (
    <div className={`relative ${conector}`}>
      <TarjetaPartido partido={partido} destacado={destacadoDe(partido, cuadro)} className="w-full" />
    </div>
  );
}
