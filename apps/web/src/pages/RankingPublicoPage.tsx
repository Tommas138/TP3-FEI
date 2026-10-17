import type { RankingPublico } from '@setpoint/shared';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Campo } from '../components/Campo';
import { Chip } from '../components/Chip';
import { Numero } from '../components/Numero';
import { TablaRanking } from '../features/ranking/TablaRanking';
import { useRankingPublico } from '../features/ranking/useRankingPublico';
import { ErrorApi } from '../lib/api';

// Para buscar "fernandez" y encontrar a Fernández.
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function mensajeDeError(error: Error) {
  if (error instanceof ErrorApi && error.codigo === 'ORGANIZACION_NO_ENCONTRADA') return 'No encontramos ese circuito. Revisá el enlace.';
  if (error instanceof ErrorApi && error.codigo === 'SIN_CONEXION') return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
  return 'No pudimos cargar el ranking. Probá de nuevo en unos minutos.';
}

// Ranking del circuito para cualquiera con el enlace, sin cuenta (F09).
export function RankingPublicoPage() {
  const { slug = '' } = useParams();
  const ranking = useRankingPublico(slug);

  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col gap-[18px] px-4 pt-5 pb-7">
      {ranking.data && <Encabezado organizacion={ranking.data.organizacion} />}
      {ranking.isPending && <p className="text-[15px] text-gris-500">Cargando el ranking…</p>}
      {ranking.error && <p className="text-[15px] text-gris-700">{mensajeDeError(ranking.error)}</p>}
      {ranking.data &&
        (ranking.data.usaRanking ? (
          <Ranking ranking={ranking.data} />
        ) : (
          <p className="text-[15px] text-gris-700">Este circuito no lleva ranking.</p>
        ))}
    </main>
  );
}

function Encabezado({ organizacion }: { organizacion: string }) {
  return (
    <div className="flex items-center gap-[9px]">
      <div className="flex size-[26px] items-center justify-center rounded-[7px] bg-negro">
        <div className="size-[9px] rounded-full bg-lima" />
      </div>
      <span className="text-base font-semibold tracking-[-0.015em]">{organizacion}</span>
    </div>
  );
}

function Ranking({ ranking }: { ranking: RankingPublico }) {
  // Abre en la primera categoría que tiene jugadores: una vacía no dice nada a quien llega del enlace.
  const [categoriaId, setCategoriaId] = useState(
    (ranking.categorias.find((c) => c.filas.length > 0) ?? ranking.categorias[0])?.id,
  );
  const [busqueda, setBusqueda] = useState('');
  const categoria = ranking.categorias.find((c) => c.id === categoriaId);

  if (!categoria) return <p className="text-[15px] text-gris-700">Este circuito todavía no cargó sus categorías.</p>;

  // Cada fila conserva su puesto: se busca para ver dónde está alguien, no para reordenar.
  const termino = normalizar(busqueda);
  const filas = termino ? categoria.filas.filter((f) => normalizar(f.apellido).includes(termino)) : categoria.filas;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px] font-semibold tracking-[-0.035em]">Ranking</h1>
        <div className="flex flex-wrap gap-1.5">
          {ranking.categorias.map((c) => (
            <Chip key={c.id} activo={c.id === categoria.id} onClick={() => setCategoriaId(c.id)}>
              {c.nombre}
            </Chip>
          ))}
        </div>
      </div>

      <Campo
        id="buscar-jugador"
        rotulo="Buscar por apellido"
        type="search"
        autoComplete="off"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="flex items-baseline justify-between gap-3 pt-0.5">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Toda la tabla</h2>
        <Numero className="text-[13px] text-gris-500">
          {categoria.filas.length} {categoria.filas.length === 1 ? 'jugador' : 'jugadores'}
        </Numero>
      </div>

      {categoria.filas.length === 0 ? (
        <p className="text-[15px] text-gris-500">Todavía no hay jugadores en esta categoría.</p>
      ) : filas.length === 0 ? (
        <p className="text-[15px] text-gris-500">Nadie en {categoria.nombre} tiene ese apellido.</p>
      ) : (
        <TablaRanking filas={filas} torneosDelCalendario={ranking.torneosDelCalendario} />
      )}

      <p className="text-[13px] text-gris-500">Tocá a cualquiera para ver los puntos de cada torneo del calendario.</p>
    </>
  );
}
