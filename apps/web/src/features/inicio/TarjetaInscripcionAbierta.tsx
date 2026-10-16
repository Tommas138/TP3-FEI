import { useNavigate } from 'react-router-dom';
import { BarraProgreso } from '../../components/BarraProgreso';
import { Boton } from '../../components/Boton';
import { Numero } from '../../components/Numero';
import { Tarjeta } from '../../components/Tarjeta';
import type { TorneoConInscripcionAbierta } from './torneosEjemplo';

export function TarjetaInscripcionAbierta({ torneo }: { torneo: TorneoConInscripcionAbierta }) {
  const navegar = useNavigate();

  return (
    <Tarjeta className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-[5px]">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{torneo.nombre}</h3>
        <p className="text-sm text-gris-500">{torneo.detalle}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-gris-500">Inscriptos que pagaron</span>
          <Numero className="text-sm font-medium">
            {torneo.pagaron} <span className="text-gris-400">/ {torneo.cupo}</span>
          </Numero>
        </div>
        <BarraProgreso valor={torneo.pagaron} total={torneo.cupo} color="lima" rotulo="Inscriptos que pagaron" />
      </div>

      <div className="flex gap-[9px]">
        <Boton className="grow" onClick={() => navegar(`/torneos/${torneo.id}/inscripciones`)}>
          Inscripciones
        </Boton>
        {/* Se conecta cuando exista el link de inscripción (F12). */}
        <Boton>Copiar link</Boton>
      </div>
    </Tarjeta>
  );
}
