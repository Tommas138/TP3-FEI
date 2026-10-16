import type { RequestHandler } from 'express';
import type { ZodError, ZodType } from 'zod';

// Un mensaje por campo: el primero que encontró Zod. Es la forma de `campos` en las respuestas 400.
export function camposConError(error: ZodError) {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = issue.path.join('.') || '_';
    campos[campo] ??= issue.message;
  }
  return campos;
}

// Valida req.body y lo reemplaza por el resultado parseado (con trim, lowercase, etc.).
export function validar(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body);
    if (!resultado.success) {
      res.status(400).json({ error: 'DATOS_INVALIDOS', campos: camposConError(resultado.error) });
      return;
    }
    req.body = resultado.data;
    next();
  };
}
