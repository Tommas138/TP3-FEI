import { Router } from 'express';
import {
  ingresoSchema,
  recuperarContrasenaSchema,
  registroOrganizacionSchema,
  restablecerContrasenaSchema,
} from '@setpoint/shared';
import { validar } from '../../middleware/validar';
import {
  ingresar,
  ingresarJugador,
  pedirRecuperacion,
  registrarOrganizacion,
  restablecerContrasena,
} from './auth.service';

export const authRouter = Router();

authRouter.post('/registro', validar(registroOrganizacionSchema), async (req, res) => {
  const respuesta = await registrarOrganizacion(req.body);
  res.status(201).json(respuesta);
});

authRouter.post('/ingreso', validar(ingresoSchema), async (req, res) => {
  res.json(await ingresar(req.body));
});

// El de la app: quien juega, no quien administra (decisión 039).
authRouter.post('/ingreso-jugador', validar(ingresoSchema), async (req, res) => {
  res.json(await ingresarJugador(req.body));
});

// Manda el link para elegir una contraseña nueva. Responde igual exista o no la cuenta.
authRouter.post('/recuperar-contrasena', validar(recuperarContrasenaSchema), async (req, res) => {
  await pedirRecuperacion(req.body);
  res.status(204).end();
});

authRouter.post('/restablecer-contrasena', validar(restablecerContrasenaSchema), async (req, res) => {
  await restablecerContrasena(req.body);
  res.status(204).end();
});
