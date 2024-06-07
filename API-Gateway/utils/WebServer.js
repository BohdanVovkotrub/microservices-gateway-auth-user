const { ExpressApp } = require('../core/ExpressApp.js');
const IndexRouter = require('../routes/index.routes.js');
const AuthMiddlewares = require('../middlewares/auth.middlewares.js');
const isAxiosError = require('../middlewares/isAxiosError.middleware.js');
const ConfigError = require('../exceptors/ConfigError.js');
const {Actions, ActionsSyncronizer} = require('./Actions.js');

const thisScriptPath = `utils/WebServer.js`;


class WebServer extends ExpressApp {
  actions;

  constructor(initData) {
    const httpConfig = {
      port: initData.config.expressConfig.general.HTTP_PORT,
      ip: initData.config.expressConfig.general.HTTP_ADDRESS,
    };
    super(httpConfig);
    this.initData = initData;
    this.middlewares = {};
  };

  run = async () => {
    try {
      await this._startExpress();
    } catch (error) {
      console.error(`Error while <run> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _getActionsRoutes = async () => {
    try {
      this.actions = await Actions.readActionsJson();

      const USER_SERVICE_URL = this.initData.config.expressConfig.apiServices.USER_SERVICE_URL;
      const actionsSyncronizer = new ActionsSyncronizer(USER_SERVICE_URL, this.actions);
      await actionsSyncronizer.sync();
    } catch (error) {
      console.error(`Error while <_getActionsRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
  _initMiddlewares = () => {
    try {
      const AUTH_SERVICE_URL = this.initData.config.expressConfig.apiServices.AUTH_SERVICE_URL;
      if (!AUTH_SERVICE_URL) throw ConfigError.parameterRequired('AUTH_SERVICE_URL');

      const authMiddlewares = new AuthMiddlewares(AUTH_SERVICE_URL);

      this.middlewares.validateAuthentication = authMiddlewares.validateAuthentication;
      this.middlewares.validateAuthorization = authMiddlewares.validateAuthorization;
    } catch (error) {
      console.error(`Error while <_initMiddlewares> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _useIsAxiosError = () => {
    try {
      this.app.use(isAxiosError);
    } catch (error) {
      console.error(`Error while <_useIsAxiosError> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _importRoutes = () => {
    try {
      const { router } = new IndexRouter(this.initData, this.middlewares, this.actions);

      this.app.use(this.initData.config.expressConfig.general.BASE_URI, router);
    } catch (error) {
      console.error(`Error while <_importRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    };
  };

  _startExpress = async () => {
    try {
      this._useHelmet();
      this._useNocache();
      this._useCors();
      this._useUrlEncoded();
      this._useJSON();
      this._useCookie();
      await this._getActionsRoutes();
      this._initMiddlewares();
      this._importRoutes();
      this._useIsAxiosError(); // должно быть перед Middleware ошибок
      this._handleErrors(); // Middleware ошибок всегда должно быть после роутов!!!
      this._start();
    } catch (error) {
      console.error(`Error while <_startExpress> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
};


module.exports = WebServer;