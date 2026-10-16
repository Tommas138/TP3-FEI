import type { InscripcionDelTorneo, MedioPago } from '@setpoint/shared';
import { Numero } from '../../components/Numero';
import { Tarjeta } from '../../components/Tarjeta';
import { diaCorto } from '../torneos/texto';

// El medio se oculta en pantallas angostas: el estado y la fecha dicen más.
const COLUMNAS = 'grid-cols-[minmax(0,1fr)_110px_120px] md:grid-cols-[minmax(0,1fr)_130px_130px_120px]';

const nombreDelMedio: Record<MedioPago, string> = {
  mercadopago: 'MercadoPago',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  otro: 'Otro',
};

// "18:42", en 24 horas.
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

// Lo que va en la columna de fecha: el día en que se inscribió o, si reserva, cuándo vence.
function fechaDe({ estado, fecha, reservaVence }: InscripcionDelTorneo) {
  if (estado === 'pagada' || reservaVence === null) return { texto: diaCorto(fecha), vence: false };
  const vencida = new Date(reservaVence) <= new Date();
  return { texto: `${vencida ? 'venció' : 'vence'} ${hora(reservaVence)}`, vence: true };
}

export function TablaInscriptos({ inscripciones }: { inscripciones: InscripcionDelTorneo[] }) {
  return (
    <Tarjeta className="flex flex-col overflow-hidden">
      <div className={`grid gap-x-1 border-b border-linea bg-fondo-tabla px-[18px] py-[11px] ${COLUMNAS}`}>
        <span className="text-xs text-gris-500">jugador</span>
        <span className="font-mono text-[11px] text-gris-500">estado</span>
        <span className="hidden font-mono text-[11px] text-gris-500 md:block">medio</span>
        <span className="font-mono text-[11px] text-gris-500">fecha</span>
      </div>

      {inscripciones.length === 0 ? (
        <p className="px-[18px] py-4 text-sm text-gris-500">Todavía no se inscribió nadie.</p>
      ) : (
        <ul>
          {inscripciones.map((inscripcion) => {
            const pagada = inscripcion.estado === 'pagada';
            const fecha = fechaDe(inscripcion);
            return (
              <li
                key={inscripcion.id}
                className={`grid h-14 items-center gap-x-1 border-b border-linea-suave px-[18px] last:border-b-0 ${COLUMNAS} ${
                  pagada ? '' : 'bg-fondo-tabla'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`size-[7px] shrink-0 rounded-full ${pagada ? 'bg-lima' : 'bg-gris-400'}`} />
                  <span className={`truncate text-[15px] ${pagada ? 'font-medium' : ''}`}>
                    {inscripcion.nombre} {inscripcion.apellido}
                  </span>
                </div>
                <span className={`text-sm ${pagada ? '' : 'text-gris-700'}`}>{pagada ? 'Pagada' : 'Reservando'}</span>
                <Numero className="hidden text-[13px] text-gris-500 md:block">
                  {inscripcion.medio ? nombreDelMedio[inscripcion.medio] : '—'}
                </Numero>
                <Numero className={`text-[13px] whitespace-nowrap ${fecha.vence ? 'text-rojo-texto' : 'text-gris-500'}`}>
                  {fecha.texto}
                </Numero>
              </li>
            );
          })}
        </ul>
      )}
    </Tarjeta>
  );
}
