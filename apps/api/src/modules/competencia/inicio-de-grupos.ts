import { EstadoTorneo } from '@prisma/client';
import { hoy } from '../../lib/fechas';
import { prisma } from '../../lib/prisma';

// La fase de grupos arranca en la fecha de inicio del torneo (decisión 029). Nada lo dispara ese
// día, así que la API revisa al arrancar y cada hora qué torneos con las zonas confirmadas ya
// llegaron a su fecha. Si la API estuvo apagada, los pone al día en la primera vuelta.

const CADA_HORA = 60 * 60 * 1000;

// Las fechas de día se guardan a medianoche UTC: llegó la fecha si es hoy o antes.
export async function arrancarFaseDeGrupos(dia: string) {
  const { count } = await prisma.torneo.updateMany({
    where: { estado: EstadoTorneo.ZONAS_GENERADAS, fechaInicio: { lte: new Date(`${dia}T00:00:00.000Z`) } },
    data: { estado: EstadoTorneo.GRUPOS_EN_CURSO },
  });
  return count;
}

export function programarInicioDeGrupos() {
  const revisar = () =>
    arrancarFaseDeGrupos(hoy()).catch((error) => console.error('No se pudo arrancar la fase de grupos', error));
  void revisar();
  // unref: el temporizador no mantiene viva a la API si todo lo demás terminó.
  setInterval(revisar, CADA_HORA).unref();
}
