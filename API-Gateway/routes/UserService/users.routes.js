const { Router } = require('express');
const axios = require('axios');
const ConfigError = require('../../exceptors/ConfigError.js');
const { ApiError } = require('../../core/ExpressApp.js');

class UsersRouter {
  constructor(initData, middlewares, actions) {
    this.apiServices = initData.config.expressConfig.apiServices;
    this.middlewares = middlewares;
    this.actions = actions;
    this.router = new Router();
    this._initRoutes(initData);
  };

  _initRoutes = () => {
    if (!this.apiServices.USER_SERVICE_URL) 
      throw ConfigError.parameterRequired('USER_SERVICE_URL');
    
    const authentication = this.middlewares.validateAuthentication;
    const authorization = this.middlewares.validateAuthorization;

    const actions = this.actions.UserService.usersRouter;

    this.router.post('/', [ authentication, authorization(actions.registerNewUser) ], this.registerNewUser);
    this.router.get('/', [ authentication, authorization(actions.getAllUsers) ], this.getAllUsers);
    this.router.get('/:userId', [ authentication, authorization(actions.getOneUserById) ], this.getOneUserById);
    this.router.patch('/:userId', [ authentication, authorization(actions.updateOneUser) ], this.updateOneUser);
    this.router.delete('/:userId', [ authentication, authorization(actions.removeOneUser) ], this.removeOneUser);
    this.router.get('/:userId/roles', [ authentication, authorization(actions.getAllUserRoles) ], this.getAllUserRoles);
    this.router.get('/:userId/actions', [ authentication, authorization(actions.getAllUserRoles) ], this.getAllUserActions);
  };

  registerNewUser = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
  
  getOneUserById = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users/${userId}`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  updateOneUser = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users/${userId}`;
      const response = await axios.patch(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  removeOneUser = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users/${userId}`;
      const response = await axios.delete(target);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };


  getAllUserRoles = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users/${userId}/roles`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  getAllUserActions = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/users/${userId}/actions`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
};


module.exports = UsersRouter;