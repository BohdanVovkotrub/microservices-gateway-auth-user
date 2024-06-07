const { ExpressApp } = require('../core/ExpressApp.js');
const IndexRouter = require('../routes/index.routes.js');
const UserService = require('./UserService.js');
const Passport = require('./Passport.js');
const isAxiosError = require('../middlewares/isAxiosError.middleware.js');

const thisScriptPath = `utils/WebServer.js`;

class WebServer extends ExpressApp {
  constructor(initData) {
    const httpConfig = {
      port: initData.config.expressConfig.general.HTTP_PORT,
      ip: initData.config.expressConfig.general.HTTP_ADDRESS,
    };
    super(httpConfig);
    this.initData = initData;
    
    this.userService = new UserService(this.initData.config.apiServices.USER_SERVICE_URL);
    this.passport = new Passport(this.userService);
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

  _initMiddlewares = () => {
    try {
      
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

  _startExpress = async () => {
    try {
      this._useHelmet();
      this._useNocache();
      this._useCors();
      this._useUrlEncoded();
      this._useJSON();
      this._useCookie();
      await this._usePassport();
      // this._initMiddlewares();
      this._importRoutes();
      this._useIsAxiosError(); // должно быть перед Middleware ошибок
      this._handleErrors(); // Middleware ошибок всегда должно быть после роутов!!!
      this._start();
    } catch (error) {
      console.error(`Error while <_startExpress> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _usePassport = async () => {
    try {
      this.app.use(this.passport.initialize());

      this.passport.useLocalStrategy();
      this.passport.useLdapStrategy(this.initData.config.authenticationConfig.ldap);
   
      this.passport.useSerializeUser();
      this.passport.useDeserializeUser();
    } catch (error) {
      console.error(`Error while <_initPassport> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };



  _importRoutes = () => {
    try {
      const { router } = new IndexRouter(this.initData, this.passport, this.userService);
      this.app.use(this.initData.config.expressConfig.general.BASE_URI, router);
    } catch (error) {
      console.error(`Error while <_importRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    };
  };
};


module.exports = WebServer;