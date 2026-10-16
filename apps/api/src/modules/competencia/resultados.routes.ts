import { Router } from 'express';
import { resultadoSchema } from '@setpoint/shared';
import { autenticar } from '../../middleware/autenticar';
import { validar } from '../../middleware/validar';
import { guardarResultado, listarPartidos, obtenerPartido, simularResultado } from './resultados.service';

// Se monta en /api/organizaciones/:slug/torneos/:id/partidos: mergeParams trae el slug y el id.
// Los resultados los carga solo la organización (03-flujo-organizacion.md §10). Que también
// puedan cargarlos los jugadores es la decisión abierta 12.
export const resultadosRouter = Router({ mergeParams: true });

resultadosRouter.use(autenticar);

// Todos los partidos del torneo, para elegir cuál cargar (decisión 031).
resultadosRouter.get('/', async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  res.json(await listarPartidos(slug, res.locals.usuarioId, Number(id)));
});

resultadosRouter.get('/:partidoId', async (req, res) => {
  const { slug, id, partidoId } = req.params as { slug: string; id: string; partidoId: string };
  res.json(await obtenerPartido(slug, res.locals.usuarioId, Number(id), Number(partidoId)));
});

// Cargar y corregir es lo mismo: el resultado nuevo reemplaza al que haya (decisión 028).
// Acá se valida la forma; contra el sistema de juego del torneo se valida en el servicio.
resultadosRouter.put('/:partidoId/resultado', validar(resultadoSchema), async (req, res) => {
  const { slug, id, partidoId } = req.params as { slug: string; id: string; partidoId: string };
  res.json(await guardarResultado(slug, res.locals.usuarioId, Number(id), Number(partidoId), req.body));
});

// Cómo quedaría la zona con ese resultado, sin guardarlo: la vista previa de la pantalla
// (decisión 032). Recibe lo mismo que el PUT y rechaza lo mismo.
resultadosRouter.post('/:partidoId/simulacion', validar(resultadoSchema), async (req, res) => {
  const { slug, id, partidoId } = req.params as { slug: string; id: string; partidoId: string };
  res.json(await simularResultado(slug, res.locals.usuarioId, Number(id), Number(partidoId), req.body));
});
