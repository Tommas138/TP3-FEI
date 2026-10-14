import { Router } from 'express';
import { autenticar } from '../../middleware/autenticar';
import { obtenerPosiciones } from './posiciones.service';

// Se monta en /api/organizaciones/:slug/torneos/:id/posiciones: mergeParams trae el slug y el id.
// Por ahora solo para quien administra la organización. La consulta pública (F10) y Mi zona
// (F11) van a tener su propia ruta sobre el mismo servicio (decisión 019).
export const posicionesRouter = Router({ mergeParams: true });

posicionesRouter.use(autenticar);

posicionesRouter.get('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await obtenerPosiciones(slug, res.locals.usuarioId, Number(id)));
});
