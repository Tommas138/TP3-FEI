import { Router } from 'express';
import { sortearSchema } from '@setpoint/shared';
import { autenticar } from '../../middleware/autenticar';
import { validar } from '../../middleware/validar';
import { confirmarSorteo, obtenerSorteo, sortear } from './sorteo.service';

// Se monta en /api/organizaciones/:slug/torneos/:id/sorteo: mergeParams trae el slug y el id.
// El id es el de un torneo (una categoría), no el de la convocatoria.
export const sorteoRouter = Router({ mergeParams: true });

sorteoRouter.use(autenticar);

sorteoRouter.get('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await obtenerSorteo(slug, res.locals.usuarioId, Number(id)));
});

// Sortea y guarda el resultado como borrador. Se puede repetir hasta confirmar.
sorteoRouter.post('/', validar(sortearSchema), async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await sortear(slug, res.locals.usuarioId, Number(id), req.body));
});

// Confirma el borrador y genera los partidos de zona. No se deshace.
sorteoRouter.post('/confirmar', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await confirmarSorteo(slug, res.locals.usuarioId, Number(id)));
});
