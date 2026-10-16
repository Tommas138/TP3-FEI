import { Router } from 'express';
import { autenticar } from '../../middleware/autenticar';
import { cerrarInscripcion, obtenerInscripciones } from './inscripciones.service';

// Se monta en /api/organizaciones/:slug/torneos/:id/inscripciones: mergeParams trae el slug y el id.
// El id es el de un torneo (una categoría), no el de la convocatoria.
export const inscripcionesRouter = Router({ mergeParams: true });

inscripcionesRouter.use(autenticar);

inscripcionesRouter.get('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await obtenerInscripciones(slug, res.locals.usuarioId, Number(id)));
});

// Cierra la inscripción y la categoría queda lista para sortear. No se deshace.
inscripcionesRouter.post('/cerrar', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await cerrarInscripcion(slug, res.locals.usuarioId, Number(id)));
});
