import { HttpError } from "../lib/http-error.js";

// Parses params, query and body with strict Zod schemas. Controllers read
// only req.valid.*, so raw request input never reaches a database query.
export const validate = (schemas) => (req, res, next) => {
  req.valid = {};
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      const where = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return next(new HttpError(400, "VALIDATION_ERROR", where + issue.message));
    }
    req.valid[part] = result.data;
  }
  next();
};
