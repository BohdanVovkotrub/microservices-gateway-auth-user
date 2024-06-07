const { Router } = require('express');
const axios = require('axios');
const ConfigError = require('../../exceptors/ConfigError.js');
const { ApiError } = require('../../core/ExpressApp.js');

class ActionsRouter {
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

    const actions = this.actions.UserService.actionsRouter;

    this.router.post('/', [ authentication, authorization(actions.addNewAction) ], this.addNewAction);
    this.router.get('/', [ authentication, authorization(actions.getAllActions) ], this.getAllActions);
    this.router.get('/:actionId', [ authentication, authorization(actions.getOneActionById) ], this.getOneActionById);
    this.router.patch('/:actionId', [ authentication, authorization(actions.updateOneAction) ], this.updateOneAction);
    this.router.delete('/:actionId', [ authentication, authorization(actions.removeOneAction) ], this.removeOneAction);
  };

  addNewAction = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/actions`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  getAllActions = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/actions`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
  
  getOneActionById = async (req, res, next) => {
    try {
      const actionId = req.params.actionId;
      if (!actionId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/actions/${actionId}`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  updateOneAction = async (req, res, next) => {
    try {
      const actionId = req.params.actionId;
      if (!actionId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/actions/${actionId}`;
      const response = await axios.patch(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  removeOneAction = async (req, res, next) => {
    try {
      const actionId = req.params.actionId;
      if (!actionId) return next(ApiError.BadRequest());
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/actions/${actionId}`;
      const response = await axios.delete(target);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
};


module.exports = ActionsRouter;