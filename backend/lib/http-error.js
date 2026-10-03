// Thrown (or passed to next) anywhere; the error middleware turns it into
// { error: { code, message } } with this status.
export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
