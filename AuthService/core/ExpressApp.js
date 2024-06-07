const express = require('express');
const httpProxy = require('http-proxy');
const helmet = require('helmet');
const nocache = require('nocache');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const thisScriptPath = `services/API-Gateway/utils/WebServer.js`;

class ExpressApp {
  secureEnabled;
  proxy;
  
  constructor(httpConfig, httpsConfig = undefined) {
    this.app = express();
    const { port: HTTP_PORT, ip: HTTP_IP } = httpConfig;
    this.HTTP_PORT = HTTP_PORT;
    this.HTTP_IP = HTTP_IP;
    this.secureEnabled = false;
    if (!!httpsConfig) {
      const { port: HTTPS_PORT, ip: HTTPS_IP, sslCertPath, sslKeyPath } = httpsConfig;
      this.HTTPS_PORT = HTTPS_PORT;
      this.HTTPS_IP = HTTPS_IP;
      this.sslCertPath = sslCertPath;
      this.sslKeyPath = sslKeyPath;
      this.secureEnabled = true;
    };
    this._useGracefullShutdown();
  };


  _useHelmet = () => {
    try {
      const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
      this.app.use(helmet.contentSecurityPolicy({
        directives: { ...defaultDirectives }
      }));
      this.app.use(helmet.crossOriginEmbedderPolicy());
      this.app.use(helmet.crossOriginOpenerPolicy());
      this.app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
      this.app.use(helmet.dnsPrefetchControl());
      this.app.use(helmet.frameguard());
      this.app.use(helmet.hidePoweredBy());
      this.app.use(helmet.hsts({
        maxAge: 15552000,   // 180 days
        includeSubDomains: true,
        preload: true
      }));
      this.app.use(helmet.ieNoOpen());
      this.app.use(helmet.noSniff());
      this.app.use(helmet.originAgentCluster());
      this.app.use(helmet.permittedCrossDomainPolicies());
      this.app.use(helmet.referrerPolicy());
      // this.app.use(helmet.xssFilter());
      this.app.use((req, res, next) => {
          res.setHeader("X-XSS-Protection", "1; mode=block");
          next();
      });
      this.app.use((req, res, next) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        next();
      });
    } catch (error) {
      console.error(`Error while <_useHelmet> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };

  _useNocache = () => {
    try {
      this.app.use(nocache());
    } catch (error) {
      console.error(`Error while <_useNocache> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };

  _useCors = () => {
    try {
      this.app.use(cors({ 
        exposedHeaders: 'Authorization',
      }));
    } catch (error) {
      console.error(`Error while <_useCors> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };

  _useUrlEncoded = () => {
    try {
      this.app.use(express.urlencoded({ extended: true }));
    } catch (error) {
      console.error(`Error while <_useUrlEncoded> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };

  _useJSON = () => {
    try {
      this.app.use(express.json());
    } catch (error) {
      console.error(`Error while <_useJSON> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    }
  };

  _useCookie = () => {
    try {
      this.app.use(cookieParser());
    } catch (error) {
      console.error(`Error while <_useCookie> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };

  _start = () => {
    try {
      this.app.listen(this.HTTP_PORT, this.HTTP_IP, () => console.log(`SERVER IS RUNNING ON http://${this.HTTP_IP}:${this.HTTP_PORT}`));
    } catch (error) {
      console.error(`Error while <_start> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };

  _handleErrors = () => {
    try {
      this.app.use((error, req, res, next) => {
        console.log(`Handled error <${error.constructor.name}>: ${error.message}`);

        if (error instanceof ApiError) {
          return res.status(error.status).send({ message: error.message, errors: error.errors });
        };
        return res.status(500).send({ message: error.message });
      });
    } catch (error) {
      console.error(`Error while <_handleErrors> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`)
      throw error;
    };
  };

  _useProxy = () => {
    try {
      this.proxy = httpProxy.createProxyServer({});
    } catch (error) {
      console.error(`Error while <_useProxy> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _useGracefullShutdown = () => {
    try {
      process.on('SIGINT', () => {
        console.log([{FgGray: '\rGracefully shutting down server (Ctrl-C)'}], 'critical');
        return process.exit(0);
      });
    } catch (error) {
      console.error(`Error while <_useGracefullShutdown> in class <ExpressApp> in <ExpressApp.mjs>. Details: ${error.message}.`);
      throw error;
    };
  };
};

class ApiError extends Error {
  status;
  errors;

  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  };

  static BadRequest(message, errors = []) {
    return new ApiError(400, message, errors);
  };
  static UnathorizedError() {
    return new ApiError(401, 'User is not authorized.');
  };
  static Forbidden(message = '') {
    return new ApiError(403, 'Forbidden. ' + message);
  };
  static DataNotFound(message = '') {
    return new ApiError(404, 'Data not found. ' + message);
  };
  static Conflict(message = '') {
    return new ApiError(409, 'Conflict. A conflict with the current state of a resource. ' + message);
  };
  static Gone(message = '') {
    return new ApiError(410, 'Gone. The requested resource is no longer available at the server. ' + message);
  };
  static InternalServerError(message = '') {
    return new ApiError(500, 'Internal server error. ' + message);
  };
};

module.exports = {
  ExpressApp,
  ApiError,
};