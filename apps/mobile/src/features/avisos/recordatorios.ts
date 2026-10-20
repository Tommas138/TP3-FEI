// Recordatorio antes de cada partido con fecha (F11). Lo programa el celular, no la API: llega
// aunque el celular no tenga conexión a esa hora (decisión 047).
import type { PartidoDelJugador } from '@setpoint/shared';
import { diaYHora } from '../../lib/fechas';
import { CANAL } from './avisos';
import { Notifications } from './notificaciones';

const PREFIJO = 'partido-';
const HORA = 3_600_000;

// Un día antes. Si la fecha se anotó con menos de un día, dos horas antes; si falta menos, nada.
export function cuandoRecordar(fechaAcordada: string, ahora = Date.now()) {
  const partido = new Date(fechaAcordada).getTime();
  const opciones = [partido - 24 * HORA, partido - 2 * HORA];
  const cuando = opciones.find((t) => t > ahora);
  return cuando === undefined ? null : new Date(cuando);
}

// Rehace los recordatorios con los partidos de ahora: cada vez que se cargan, para que una fecha
// cambiada o un partido ya jugado no quede con su recordatorio viejo.
export async function programarRecordatorios(partidos: PartidoDelJugador[]) {
  const avisos = Notifications;
  if (!avisos) return;
  try {
    const programados = await avisos.getAllScheduledNotificationsAsync();
    await Promise.all(
      programados
        .filter((n) => n.identifier.startsWith(PREFIJO))
        .map((n) => avisos.cancelScheduledNotificationAsync(n.identifier)),
    );

    for (const p of partidos) {
      if (!p.fechaAcordada || !p.rival || p.resultado) continue;
      const cuando = cuandoRecordar(p.fechaAcordada);
      if (!cuando) continue;
      await avisos.scheduleNotificationAsync({
        identifier: `${PREFIJO}${p.id}`,
        content: {
          title: `Jugás con ${p.rival.nombre} ${p.rival.apellido}`,
          body: [diaYHora(p.fechaAcordada), p.sede].filter(Boolean).join(' · '),
        },
        trigger: { type: avisos.SchedulableTriggerInputTypes.DATE, date: cuando, channelId: CANAL },
      });
    }
  } catch {
    // Sin permiso o sin soporte: la pantalla funciona igual.
  }
}
