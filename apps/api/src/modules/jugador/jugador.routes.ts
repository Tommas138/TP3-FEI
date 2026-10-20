import { Router } from 'express';
import { dispositivoSchema } from '@setpoint/shared';
import { autenticar } from '../../middleware/autenticar';
import { validar } from '../../middleware/validar';
import { borrarDispositivo, guardarDispositivo } from '../avisos/avisos.service';
import { miZona } from './mi-zona.service';
import { misPartidos } from './mis-partidos.service';

// Se monta en /api/jugador/:slug. Lo que ve el jugador de sí mismo en la app: pide login y un
// perfil de jugador activo en la organización (decisión 044).
export const jugadorRouter = Router({ mergeParams: true });

jugadorRouter.use(autenticar);

jugadorRouter.get('/zona', async (req, res) => {
  const { slug } = req.params as { slug: string };
  res.json(await miZona(slug, res.locals.usuarioId));
});

jugadorRouter.get('/partidos', async (req, res) => {
  const { slug } = req.params as { slug: string };
  res.json(await misPartidos(slug, res.locals.usuarioId));
});

// El celular donde recibe los avisos (decisión 047). La app lo manda al entrar y lo borra al salir.
jugadorRouter.put('/dispositivo', validar(dispositivoSchema), async (req, res) => {
  const { slug } = req.params as { slug: string };
  await guardarDispositivo(slug, res.locals.usuarioId, req.body);
  res.status(204).end();
});

jugadorRouter.delete('/dispositivo', validar(dispositivoSchema), async (req, res) => {
  await borrarDispositivo(res.locals.usuarioId, req.body);
  res.status(204).end();
});
