const { Router } = require('express');
const axios = require('axios');
const ConfigError = require('../../exceptors/ConfigError.js');
const { ApiError } = require('../../core/ExpressApp.js');

class RolesRouter {
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

    const actions = this.actions.UserService.rolesRouter;

    this.router.post('/', [ authentication, authorization(actions.addNewRole) ], this.addNewRole);
    this.router.get('/', [ authentication, authorization(actions.getAllRoles) ], this.getAllRoles);
    this.router.get('/:roleId', [ authentication, authorization(actions.getOneRoleById) ], this.getOneRoleById);
    this.router.patch('/:roleId', [ authentication, authorization(actions.updateOneRole) ], this.updateOneRole);
    this.router.delete('/:roleId', [ authentication, authorization(actions.removeOneRole) ], this.removeOneRole);
  };

  addNewRole = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/roles`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  getAllRoles = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/roles`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
  
  getOneRoleById = async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      if (!roleId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/roles/${roleId}`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  updateOneRole = async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      if (!roleId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/roles/${roleId}`;
      const response = await axios.patch(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  removeOneRole = async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      if (!roleId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/roles/${roleId}`;
      const response = await axios.delete(target);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
};


module.exports = RolesRouter;