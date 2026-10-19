import type { ClaveCuadro, Cuadros } from '@setpoint/shared';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Chip } from '../components/Chip';
import { EncabezadoPublico } from '../components/EncabezadoPublico';
import { BotonCompartir } from '../features/cuadros/BotonCompartir';
import { CuadroCompleto } from '../features/cuadros/CuadroCompleto';
import { CuadroPorRonda } from '../features/cuadros/CuadroPorRonda';
import { NOMBRE_DEL_CUADRO, bajada } from '../features/cuadros/cuadro';
import { useCuadrosPublicos } from '../features/cuadros/useCuadrosPublicos';
import { ErrorApi } from '../lib/api';

function mensajeDeError(error: Error) {
  if (error instanceof ErrorApi && (error.codigo === 'ORGANIZACION_NO_ENCONTRADA' || error.codigo === 'TORNEO_NO_ENCONTRADO')) {
    return 'No encontramos ese torneo. Revisá el enlace.';
  }
  if (error instanceof ErrorApi && error.codigo === 'CUADROS_NO_GENERADOS') {
    return 'Los cuadros se arman cuando terminan las zonas. Volvé a mirar más adelante.';
  }
  if (error instanceof ErrorApi && error.codigo === 'SIN_CONEXION') return 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.';
  return 'No pudimos cargar los cuadros. Probá de nuevo en unos minutos.';
}

// Los cuadros eliminatorios de un torneo para cualquiera con el enlace, sin cuenta (F08, F10).
// En escritorio se ven completos y lado a lado; en el celular, una ronda a la vez (decisión 038).
export function CuadrosPublicoPage() {
  const { slug = '', id = '' } = useParams();
  const cuadros = useCuadrosPublicos(slug, id);

  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col gap-[18px] px-4 pt-5 pb-7 xl:max-w-none xl:gap-0 xl:px-0 xl:pt-0">
      {cuadros.isPending && <p className="text-[15px] text-gris-500">Cargando los cuadros…</p>}
      {cuadros.error && <p className="text-[15px] text-gris-700">{mensajeDeError(cuadros.error)}</p>}
      {cuadros.data && <LosCuadros datos={cuadros.data} />}
    </main>
  );
}

function LosCuadros({ datos }: { datos: Cuadros }) {
  const titulo = datos.cuadros.length > 1 ? 'Los dos cuadros' : 'El cuadro';
  const [elegido, setElegido] = useState<ClaveCuadro>(datos.cuadros[0]?.cuadro ?? 'campeonato');
  const cuadroElegido = datos.cuadros.find((c) => c.cuadro === elegido);

  return (
    <>
      <header className="xl:flex xl:h-[58px] xl:items-center xl:border-b xl:border-linea xl:px-[30px]">
        <EncabezadoPublico organizacion={datos.organizacion} detalle={datos.nombre} />
      </header>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 xl:px-[30px] xl:pt-[26px] xl:pb-[22px]">
        <div className="flex flex-col gap-[7px]">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em]">{titulo}</h1>
          <p className="text-[15px] text-gris-500">{bajada(datos.cuadros, datos.clasificadosPorGrupo)}</p>
        </div>
        <BotonCompartir titulo={`${titulo} · ${datos.nombre}`} />
      </div>

      {/* Celular y tablet: un cuadro a la vez y una ronda a la vez, sin scroll horizontal. */}
      <div className="flex flex-col gap-4 xl:hidden">
        {datos.cuadros.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {datos.cuadros.map((c) => (
              <Chip key={c.cuadro} activo={c.cuadro === elegido} onClick={() => setElegido(c.cuadro)}>
                {NOMBRE_DEL_CUADRO[c.cuadro]}
              </Chip>
            ))}
          </div>
        )}
        {cuadroElegido && <CuadroPorRonda key={cuadroElegido.cuadro} cuadro={cuadroElegido} />}
      </div>

      {/* Escritorio: los cuadros completos. Si no entran lado a lado, uno debajo del otro. */}
      <div className="hidden flex-wrap gap-x-[60px] gap-y-10 overflow-x-auto px-[30px] pb-[34px] xl:flex">
        {datos.cuadros.map((c) => (
          <CuadroCompleto key={c.cuadro} cuadro={c} />
        ))}
      </div>

      <p className="text-[13px] text-gris-500 xl:px-[30px] xl:pb-[30px]">Tocá cualquier partido para ver el marcador set por set.</p>
    </>
  );
}
