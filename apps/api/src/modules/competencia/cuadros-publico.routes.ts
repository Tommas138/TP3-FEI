import { Router } from 'express';
import { cuadrosPublicos } from './cuadros.service';

// Se monta en /api/publico/:slug/torneos/:id/cuadros. Sin login, como todo lo que cuelga de
// /api/publico (decisión 033): es la página de los cuadros que la organización comparte (F10).
export const cuadrosPublicoRouter = Router({ mergeParams: true });

cuadrosPublicoRouter.get('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await cuadrosPublicos(slug, Number(id)));
});
