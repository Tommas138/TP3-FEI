import type { DatosDispositivo } from '@setpoint/shared';
import { perfilDeJugador } from '../../lib/permisos';
import { prisma } from '../../lib/prisma';
import { avisosDeFixture, tokensDadosDeBaja, type Aviso } from './avisos';

// El servicio de avisos de Expo: entrega a cada celular por Firebase, con las credenciales que
// se cargan en EAS al generar el APK (decisión 047). La API no guarda ningún secreto.
const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
const POR_PEDIDO = 100;

// El celular desde el que el jugador ingresó a la app. Si el token ya estaba con otro usuario
// (otra cuenta en el mismo celular), pasa a ser del que ingresó ahora.
export async function guardarDispositivo(slug: string, usuarioId: number, { token }: DatosDispositivo) {
  await perfilDeJugador(slug, usuarioId);
  await prisma.dispositivoAviso.upsert({ where: { token }, create: { token, usuarioId }, update: { usuarioId } });
}

// Al cerrar sesión, ese celular deja de recibir los avisos de la cuenta.
export async function borrarDispositivo(usuarioId: number, { token }: DatosDispositivo) {
  await prisma.dispositivoAviso.deleteMany({ where: { token, usuarioId } });
}

// Manda los avisos a todos los celulares de cada usuario. No tira error: un aviso que no sale
// no puede deshacer lo que lo disparó. Sin conexión a internet (la demo con docker compose),
// se registra y sigue.
export async function enviarAvisos(avisos: Aviso[]) {
  if (avisos.length === 0) return;
  const dispositivos = await prisma.dispositivoAviso.findMany({
    where: { usuarioId: { in: avisos.map((a) => a.usuarioId) } },
    select: { usuarioId: true, token: true },
  });
  const mensajes = avisos.flatMap((aviso) =>
    dispositivos
      .filter((d) => d.usuarioId === aviso.usuarioId)
      .map((d) => ({ to: d.token, title: aviso.titulo, body: aviso.cuerpo, sound: 'default', channelId: 'avisos' })),
  );

  for (let i = 0; i < mensajes.length; i += POR_PEDIDO) {
    const tanda = mensajes.slice(i, i + POR_PEDIDO);
    try {
      const respuesta = await fetch(URL_EXPO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(tanda),
      });
      const { data } = await respuesta.json();
      const deBaja = tokensDadosDeBaja(
        tanda.map((m) => m.to),
        Array.isArray(data) ? data : [],
      );
      if (deBaja.length > 0) await prisma.dispositivoAviso.deleteMany({ where: { token: { in: deBaja } } });
    } catch (error) {
      console.error('No se pudieron mandar los avisos', error);
    }
  }
}

// El fixture quedó publicado al confirmarse el sorteo (decisión 047).
export async function avisarFixture(torneoId: number) {
  const torneo = await prisma.torneo.findUniqueOrThrow({
    where: { id: torneoId },
    select: {
      nombre: true,
      edicion: true,
      categoria: { select: { nombre: true } },
      inscripciones: { where: { grupo: { not: null } }, select: { grupo: true, jugador: { select: { usuarioId: true } } } },
    },
  });
  const nombre = `${torneo.edicion ?? torneo.nombre} · ${torneo.categoria.nombre}`;
  await enviarAvisos(
    avisosDeFixture(
      nombre,
      torneo.inscripciones.map((i) => ({ usuarioId: i.jugador.usuarioId, grupo: i.grupo! })),
    ),
  );
}
