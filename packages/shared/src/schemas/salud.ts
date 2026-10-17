import { z } from 'zod';

// Lo que responde GET /api/salud. La app lo valida al conectarse: si la respuesta llega, la API es
// la de SetPoint y no otro servicio escuchando en esa dirección.
export const respuestaSaludSchema = z.object({
  ok: z.literal(true),
  servicio: z.string(),
});

export type RespuestaSalud = z.infer<typeof respuestaSaludSchema>;
