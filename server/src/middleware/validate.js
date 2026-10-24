import { sendError } from '../utils/response.js';

export function validate(schema) {
  return async (req, res, next) => {
    try {
      if (schema.body && req.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query && req.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params && req.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      return next();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(res, 'Validation failed', formattedErrors, 422);
      }
      return sendError(res, 'Invalid request data', null, 400);
    }
  };
}
