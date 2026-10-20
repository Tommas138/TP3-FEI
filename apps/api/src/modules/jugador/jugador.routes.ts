import { Router } from 'express';
import { autenticar } from '../../middleware/autenticar';
import { miZona } from './mi-zona.service';

// Se monta en /api/jugador/:slug. Lo que ve el jugador de sí mismo en la app: pide login y un
// perfil de jugador activo en la organización (decisión 044).
export const jugadorRouter = Router({ mergeParams: true });

jugadorRouter.use(autenticar);

jugadorRouter.get('/zona', async (req, res) => {
  const { slug } = req.params as { slug: string };
  res.json(await miZona(slug, res.locals.usuarioId));
});
