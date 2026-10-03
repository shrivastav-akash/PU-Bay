import multer from "multer";
import { HttpError } from "../lib/http-error.js";
import { removeUpload } from "../lib/uploads.js";

export const notFound = (req, res, next) => {
  next(new HttpError(404, "NOT_FOUND", "Route not found"));
};

function describe(err) {
  if (err instanceof HttpError) return [err.status, err.code, err.message];
  if (err instanceof multer.MulterError) {
    return err.code === "LIMIT_FILE_SIZE"
      ? [413, "FILE_TOO_LARGE", "That file is too large"]
      : [400, "UPLOAD_ERROR", "Upload one file in the expected field"];
  }
  if (err.type === "entity.parse.failed") return [400, "INVALID_JSON", "Request body is not valid JSON"];
  if (err.type === "entity.too.large") return [413, "PAYLOAD_TOO_LARGE", "Request body is too large"];
  if (err.code === 11000) return [409, "CONFLICT", "That value is already in use"];
  return null;
}

// The single place errors become responses: { error: { code, message } }.
// Anything unexpected is logged here and never echoed to the client.
export const errorHandler = (err, req, res, next) => {
  // A request that failed after its upload was saved shouldn't leave the file behind.
  if (req.file) removeUpload(req.file.filename);
  if (res.headersSent) return next(err);

  const known = describe(err);
  if (!known) console.error(err);
  const [status, code, message] = known ?? [500, "INTERNAL_ERROR", "Something went wrong"];
  res.status(status).json({ error: { code, message } });
};
