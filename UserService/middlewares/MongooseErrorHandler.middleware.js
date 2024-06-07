const ApiError = require('../exceptors/ApiError.js');

class MongoErrorHandler {
  static handle(error, req, res, next) {
    if (error instanceof Error && error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(ApiError.BadRequest(validationErrors.join(', ')));
    } else if (error instanceof Error && error.name === 'CastError' && error.kind === 'ObjectId') {
      return next(ApiError.BadRequest('Invalid ObjectId'));
    } else if (error instanceof Error && error.code === 11000) {
      return next(ApiError.Conflict('This item already exists.'));
    } else {
      return next(error);
    }
  }
};


module.exports = MongoErrorHandler;