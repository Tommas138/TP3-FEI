import { Router } from 'express';
import { rankingPublico } from './ranking-publico.service';

// Se monta en /api/publico/:slug/ranking. Sin login: todo lo que se consulta sin cuenta
// vive bajo /api/publico (decisión 033).
export const rankingPublicoRouter = Router({ mergeParams: true });

rankingPublicoRouter.get('/', async (req, res) => {
  const { slug } = req.params as { slug: string };
  res.json(await rankingPublico(slug));
});
