const { Router } = require('express');
const AuthenticationRouter = require('./authentication.routes.js');
const AuthorizationRouter = require('./authorization.routes.js');

class IndexRouter {
  constructor(initData, passport, userService) {
    this.initData = initData;
    this.passport = passport;
    this.userService = userService;
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    const authenticationRouter = new AuthenticationRouter(this.initData, this.passport, this.userService).router;
    const authorizationRouter = new AuthorizationRouter(this.initData, this.userService).router;

    this.router.use('/authentication', authenticationRouter);
    this.router.use('/authorization', authorizationRouter);
  };
};

module.exports = IndexRouter;