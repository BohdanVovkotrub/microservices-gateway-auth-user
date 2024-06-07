const { Router } = require('express');
const UsersRouter = require('./users.routes.js');
const UsergroupsRouter = require('./usergroups.routes.js');
const RolesRouter = require('./roles.routes.js');
const ActionRouter = require('./actions.routes.js');
const AuthenticationRouter = require('./authentication.routes.js');

const thisScriptPath = `routes/index.routes.js`;

class IndexRouter {
  constructor(initData) {
    this.initData = initData;
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    try {
      const usersRouter = new UsersRouter().router;
      const usergroupsRouter = new UsergroupsRouter().router;
      const rolesRouter = new RolesRouter().router;
      const actionsRouter = new ActionRouter().router;
      const authenticationRouter = new AuthenticationRouter().router;

      this.router.use('/users', usersRouter);
      this.router.use('/usergroups', usergroupsRouter);
      this.router.use('/roles', rolesRouter);
      this.router.use('/actions', actionsRouter);
      this.router.use('/authentication', authenticationRouter);
    } catch (error) {
      console.error(`Error while <_initRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
};

module.exports = IndexRouter;