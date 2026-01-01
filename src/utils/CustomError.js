export default class CustomError extends Error {
  constructor(status, msg) {
    super();
    this.status = status;
    this.message = msg;
  }

  static alreadyExist(message) {
    return new CustomError(409, message);
  }

  static wrongCredentials(message = 'Invalid credentials!') {
    return new CustomError(401, message);
  }

  static unAuthorized(message = 'Unauthorized') {
    return new CustomError(401, message);
  }

  static notFound(message = 'Not Found!') {
    return new CustomError(404, message);
  }

  static userNotFound(message = 'User Not Found!') {
    return new CustomError(404, message);
  }

  static badRequest(message = 'Bad Request!') {
    return new CustomError(400, message);
  }

  static forbidden(
    message = "You don't have permission to perform this action!"
  ) {
    return new CustomError(403, message);
  }

  static serverError(message = 'Internal server error!') {
    return new CustomError(500, message);
  }
}
