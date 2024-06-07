const { Router } = require('express');
const axios = require('axios');
const ConfigError = require('../../exceptors/ConfigError.js');
const { ApiError } = require('../../core/ExpressApp.js');

class UsergroupsRouter {
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

    const actions = this.actions.UserService.usergroupsRouter;

    this.router.post('/', [ authentication, authorization(actions.addNewUsergroup) ], this.addNewUsergroup);
    this.router.get('/', [ authentication, authorization(actions.getAllUsergroups) ], this.getAllUsergroups);
    this.router.get('/:usergroupId', [ authentication, authorization(actions.getOneUsergroupById) ], this.getOneUsergroupById);
    this.router.patch('/:usergroupId', [ authentication, authorization(actions.updateOneUsergroup) ], this.updateOneUsergroup);
    this.router.delete('/:usergroupId', [ authentication, authorization(actions.removeOneUsergroup) ], this.removeOneUsergroup);
  };

  addNewUsergroup = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/usergroups`;
      const response = await axios.post(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  getAllUsergroups = async (req, res, next) => {
    try {
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/usergroups`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
  
  getOneUsergroupById = async (req, res, next) => {
    try {
      const usergroupId = req.params.usergroupId;
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/usergroups/${usergroupId}`;
      const response = await axios.get(target, { params: req.query });
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  updateOneUsergroup = async (req, res, next) => {
    try {
      const usergroupId = req.params.usergroupId;
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/usergroups/${usergroupId}`;
      const response = await axios.patch(target, req.body);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };

  removeOneUsergroup = async (req, res, next) => {
    try {
      const usergroupId = req.params.usergroupId;
      const target = `${this.apiServices.USER_SERVICE_URL}/api/v1/usergroups/${usergroupId}`;
      const response = await axios.delete(target);
      return res.status(response.status).send(response.data);
    } catch (error) {
      next(error);
    }
  };
};


module.exports = UsergroupsRouter;