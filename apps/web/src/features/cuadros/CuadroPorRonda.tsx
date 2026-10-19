import type { CuadroEliminatorio } from '@setpoint/shared';
import { useState } from 'react';
import { Chip } from '../../components/Chip';
import { destacadoDe, rondaEnCurso, rotuloDeRonda } from './cuadro';
import { EncabezadoDelCuadro } from './CuadroCompleto';
import { TarjetaPartido } from './TarjetaPartido';

// El cuadro en el celular: una ronda a la vez, sin scroll horizontal (decisión 038). Abre en la
// ronda que se está jugando. Los byes no tienen partido y no aparecen.
export function CuadroPorRonda({ cuadro }: { cuadro: CuadroEliminatorio }) {
  const [ronda, setRonda] = useState(() => rondaEnCurso(cuadro));
  const rondas = Array.from({ length: cuadro.rondas }, (_, i) => i + 1);
  const partidos = cuadro.partidos.filter((p) => p.ronda === ronda);

  return (
    <section className="flex flex-col gap-4">
      <EncabezadoDelCuadro cuadro={cuadro} />
      <div className="flex flex-wrap gap-1.5">
        {rondas.map((r) => (
          <Chip key={r} activo={r === ronda} onClick={() => setRonda(r)}>
            {rotuloDeRonda(r, cuadro.rondas)}
          </Chip>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {partidos.map((partido) => (
          <TarjetaPartido key={partido.id} partido={partido} destacado={destacadoDe(partido, cuadro)} className="w-full" />
        ))}
      </div>
    </section>
  );
}
