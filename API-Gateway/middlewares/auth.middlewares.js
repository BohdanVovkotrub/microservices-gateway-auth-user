const axios = require('axios');
const ApiError = require('../exceptors/ApiError.js');

class AuthMiddlewares {
  constructor(AUTH_SERVICE_URL) {
    this.AUTH_SERVICE_URL = AUTH_SERVICE_URL;
  };

  validateAuthentication = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw ApiError.UnathorizedError();
  
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) throw ApiError.UnathorizedError('No token provided.');
      
      const targetUrl = `${this.AUTH_SERVICE_URL}/api/v1/authentication/verify-token`;

      const response = await axios.post(targetUrl, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!(response.data.authenticated === true)) {
        return next(ApiError.UnathorizedError());
      };
      const user = response.data.decoded?.user;
      if (!user) return next(ApiError.UnathorizedError());
      req.user = user;
      return next();
    } catch (error) {
      next(error);
    };
  };

  validateAuthorization = (checkActions = []) => {
    return async (req, res, next) => {
      try {
        if (!req.user?._id) return next(ApiError.UnathorizedError('asasasas'));
        const targetUrl = `${this.AUTH_SERVICE_URL}/api/v1/authorization/authorize-actions`;
        const response = await axios.post(targetUrl, {userId: req.user._id, checkActions});
        if (response.status === 200) {
          return next();
        };
        return res.status(response.status).send(response.data);
      } catch (error) {
        console.log({error})
        next(error);
      }
    };
  };
};


module.exports = AuthMiddlewares;