import { useNavigate } from 'react-router-dom';
import { BarraProgreso } from '../../components/BarraProgreso';
import { Boton } from '../../components/Boton';
import { Numero } from '../../components/Numero';
import { Tarjeta } from '../../components/Tarjeta';
import type { TorneoParaSortear } from './torneosEjemplo';

// La inscripción cerró y falta el sorteo: es lo próximo que hay que hacer con esta categoría.
export function TarjetaParaSortear({ torneo }: { torneo: TorneoParaSortear }) {
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
        <Boton variante="organizador" className="grow font-semibold" onClick={() => navegar(`/torneos/${torneo.id}/sorteo`)}>
          Sortear zonas
        </Boton>
        <Boton onClick={() => navegar(`/torneos/${torneo.id}/inscripciones`)}>Inscripciones</Boton>
      </div>
    </Tarjeta>
  );
}
