import { Link } from 'react-router-dom';
import { Boton } from '../../components/Boton';
import { Numero } from '../../components/Numero';
import { nombresDelPartido, seccionesDeLaLista, type FilaDeLaLista, type Situacion } from './resultado';
import { usePartidos } from './useResultado';

type Props = {
  slug: string;
  torneoId: number;
  // El partido abierto, si hay uno.
  actual?: number;
};

// El rojo es solo para lo vencido (design.md §3).
const colorDelEstado: Record<Situacion, string> = {
  sin_jugadores: 'text-gris-400',
  falta: 'text-gris-700',
  vencido: 'text-rojo-texto',
  con_resultado: 'text-gris-400',
};

function Fila({ fila, torneoId, actual }: { fila: FilaDeLaLista; torneoId: number; actual?: number }) {
  const { partido, situacion, estado } = fila;
  const [a, b] = nombresDelPartido(partido);
  const esActual = partido.id === actual;
  const contenido = (
    <>
      <span className={`truncate ${esActual ? 'font-semibold' : ''}`}>
        {a} · {b}
      </span>
      <span className={`shrink-0 text-[13px] ${colorDelEstado[situacion]}`}>{estado}</span>
    </>
  );
  const estilo = 'flex h-[38px] items-center justify-between gap-3 border-b border-linea-suave px-2 text-sm';

  // Un partido de cuadro sin sus dos jugadores todavía no se puede cargar.
  if (situacion === 'sin_jugadores') return <li className={`${estilo} text-gris-400`}>{contenido}</li>;
  return (
    <li>
      <Link
        to={`/torneos/${torneoId}/resultados/${partido.id}`}
        aria-current={esActual ? 'page' : undefined}
        className={`${estilo} rounded-md hover:bg-fondo ${esActual ? 'bg-fondo' : ''}`}
      >
        {contenido}
      </Link>
    </li>
  );
}

// «Cambiar partido»: los partidos del torneo agrupados por zona y por ronda de cada cuadro,
// con los que faltan primero (decisión 031). Es una versión mínima de lo que va a ser el tablero (F15).
export function SelectorDePartido({ slug, torneoId, actual }: Props) {
  const partidos = usePartidos(slug, torneoId);

  if (!partidos.data) {
    return (
      <div className="flex flex-col items-start gap-3 px-6 py-5">
        {partidos.error ? (
          <>
            <p className="text-[15px] text-gris-500">No pudimos cargar los partidos.</p>
            <Boton onClick={() => void partidos.refetch()}>Probar de nuevo</Boton>
          </>
        ) : (
          <p className="text-[15px] text-gris-500">Cargando…</p>
        )}
      </div>
    );
  }

  const secciones = seccionesDeLaLista(partidos.data.partidos);
  if (secciones.length === 0) {
    return <p className="px-6 py-5 text-[15px] text-gris-500">Todavía no hay partidos: se generan al confirmar el sorteo.</p>;
  }

  return (
    <div className="grid gap-x-6 gap-y-5 px-6 py-5 md:grid-cols-2">
      {secciones.map(({ titulo, faltan, completa, filas }) => (
        <section key={titulo} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 px-2">
            <h2 className="text-[13px] font-semibold text-gris-500">{titulo}</h2>
            <span className="shrink-0 text-xs text-gris-500">
              {faltan > 0 ? (
                <>
                  {faltan === 1 ? 'falta' : 'faltan'} <Numero>{faltan}</Numero>
                </>
              ) : completa ? (
                'completa'
              ) : (
                'sin jugadores todavía'
              )}
            </span>
          </div>
          <ul>
            {filas.map((fila) => (
              <Fila key={fila.partido.id} fila={fila} torneoId={torneoId} actual={actual} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
