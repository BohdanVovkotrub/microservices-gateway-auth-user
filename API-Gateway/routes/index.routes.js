const { Router } = require('express');

const AuthenticationRouter = require('./AuthService/authentication.routes.js');

const UsersRouter = require('./UserService/users.routes.js');
const UsergroupsRouter = require('./UserService/usergroups.routes.js');
const RolesRouter = require('./UserService/roles.routes.js');
const ActionsRouter = require('./UserService/actions.routes.js');


class IndexRouter {
  constructor(initData, middlewares, actions) {
    this.initData = initData;
    this.middlewares = middlewares;
    this.actions = actions;
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    const options = [this.initData, this.middlewares, this.actions];
    // AuthService routers
    const authenticationRouter = new AuthenticationRouter(...options).router;
    // UserService routers
    const usersRouter = new UsersRouter(...options).router;
    const usergroupsRouter = new UsergroupsRouter(...options).router;
    const rolesRouter = new RolesRouter(...options).router;
    const actionsRouter = new ActionsRouter(...options).router;

    this.router.use('/authentication', authenticationRouter);
    this.router.use('/users', usersRouter);
    this.router.use('/usergroups', usergroupsRouter);
    this.router.use('/roles', rolesRouter);
    this.router.use('/actions', actionsRouter);
  };
};

module.exports = IndexRouter;