import { z } from 'zod';

// El token con el que el servicio de avisos de Expo identifica la app en un celular (F11,
// decisión 047). Lo manda la app al ingresar, y lo borra al cerrar sesión.
export const dispositivoSchema = z.object({
  token: z.string().regex(/^Expo(nent)?PushToken\[.+\]$/, 'No es un token de avisos de Expo'),
});

export type DatosDispositivo = z.infer<typeof dispositivoSchema>;
