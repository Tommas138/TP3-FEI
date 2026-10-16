import { Router } from 'express';
import { autenticar } from '../../middleware/autenticar';
import { cerrarZonas, obtenerCuadros } from './cuadros.service';

// Se monta en /api/organizaciones/:slug/torneos/:id/cuadros: mergeParams trae el slug y el id.
// Por ahora solo para quien administra la organización. La pantalla pública de los cuadros
// (F10) va a tener su propia ruta sobre el mismo servicio (decisión 019).
export const cuadrosRouter = Router({ mergeParams: true });

cuadrosRouter.use(autenticar);

cuadrosRouter.get('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await obtenerCuadros(slug, res.locals.usuarioId, Number(id)));
});

// Cierra las zonas y arma los cuadros con las posiciones finales. No se deshace.
cuadrosRouter.post('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await cerrarZonas(slug, res.locals.usuarioId, Number(id)));
});
