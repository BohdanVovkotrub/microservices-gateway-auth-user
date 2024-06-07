const { Router } = require('express');
const axios = require('axios');
const ConfigError = require('../../exceptors/ConfigError.js');

class AuthenticationRouter {
  constructor(initData) {
    this.apiServices = initData.config.expressConfig.apiServices;
    this.router = new Router();
    this._initRoutes(initData);
  };

  _initRoutes = () => {
    if (!this.apiServices.AUTH_SERVICE_URL) 
      throw ConfigError.parameterRequired('AUTH_SERVICE_URL');

    this.router.post('/refresh-token', this.refreshToken);
    this.router.post('/login/local', this.loginLocal);
    this.router.post('/login/ldap', this.loginLDAP);
    this.router.post('/logout', this.logout)
  };

  refreshToken = async (req, res, next) => {
    try {
      const target = `${this.apiServices.AUTH_SERVICE_URL}/api/v1/authentication/refresh-token`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  loginLocal = async (req, res, next) => {
    try {
      const target = `${this.apiServices.AUTH_SERVICE_URL}/api/v1/authentication/login/local`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  loginLDAP = async (req, res, next) => {
    try {
      const target = `${this.apiServices.AUTH_SERVICE_URL}/api/v1/authentication/login/ldap`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const target = `${this.apiServices.AUTH_SERVICE_URL}/api/v1/authentication/logout`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
};


module.exports = AuthenticationRouter;