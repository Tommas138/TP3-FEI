import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { manejarErrores } from './middleware/errores';
import { authRouter } from './modules/auth/auth.routes';
import { posicionesRouter } from './modules/competencia/posiciones.routes';
import { sorteoRouter } from './modules/competencia/sorteo.routes';
import { jugadoresRouter } from './modules/jugadores/jugadores.routes';
import { organizacionesRouter } from './modules/organizaciones/organizaciones.routes';
import { importacionesRouter } from './modules/padron/importacion/importaciones.routes';
import { torneosRouter } from './modules/torneos/torneos.routes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/salud', (_req, res) => {
  res.json({ ok: true, servicio: 'setpoint-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/organizaciones/:slug/jugadores', jugadoresRouter);
// Antes que torneosRouter, que también recibe todo lo que cuelga de /torneos.
app.use('/api/organizaciones/:slug/torneos/:id/sorteo', sorteoRouter);
app.use('/api/organizaciones/:slug/torneos/:id/posiciones', posicionesRouter);
app.use('/api/organizaciones/:slug/torneos', torneosRouter);
app.use('/api/organizaciones/:slug/importaciones', importacionesRouter);
app.use('/api/organizaciones', organizacionesRouter);

app.use(manejarErrores);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
