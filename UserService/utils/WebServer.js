const { ExpressApp } = require('../core/ExpressApp.js');
const IndexRouter = require('../routes/index.routes.js');
const MongooseErrorHandler = require('../middlewares/MongooseErrorHandler.middleware.js');

const thisScriptPath = `utils/WebServer.js`;

class WebServer extends ExpressApp {
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

  _initMiddlewares = () => {
    try {
      
    } catch (error) {
      console.error(`Error while <_initMiddlewares> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _importRoutes = () => {
    try {
      const { router } = new IndexRouter(this.initData, this.proxy, this.middlewares);
      this.app.use(this.initData.config.expressConfig.general.BASE_URI, router);
    } catch (error) {
      console.error(`Error while <_importRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    };
  };

  _handleMongooseErrors = async () => {
    try {
      this.app.use(MongooseErrorHandler.handle);
    } catch (error) {
      console.error(`Error while <_handleMongooseErrors> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
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
      this._useProxy();
      this._initMiddlewares();
      this._importRoutes();
      this._handleMongooseErrors();
      this._handleErrors(); // Middleware ошибок всегда должно быть после роутов!!!
      this._start();
    } catch (error) {
      console.error(`Error while <_startExpress> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
};


module.exports = WebServer;