require('dotenv').config();
const ms = require('ms');
const MongoDB = require('./core/MongoDB.js');
const RefreshToken = require('./models/RefreshToken.model.js');
const WebServer = require('./utils/WebServer.js');
const ConfigError = require('./exceptors/ConfigError.js');

const thisScriptPath = `index.js`;

class App {
  initData;
  webserver;

  constructor() {};

  run = async () => {
    this._showWhoIam();
    this._getInitData();
    await this._syncDB();
    this._periodicalyCheckAndRemoveExpiredTokens();
    await this._runWebServer();
  };

  _showWhoIam = () => {
    const currentDateTime = new Date().toISOString();
    const { version, arch, platform, pid } = process;
    const { npm_package_name, npm_package_version } = process.env;

    console.log(
      currentDateTime, 
      `- [${npm_package_name}@${npm_package_version}]`,
      `- PID: ${pid}`, 
      `- Node ${version} ${arch} ${platform}`
    );
  };

  _getInitData = () => {
    try {
      this.initData = {
        config: {
          expressConfig: {
            general: {
              HTTP_PORT: process.env.HTTP_PORT,
              HTTP_ADDRESS: process.env.HTTP_ADDRESS,
              HTTPS_PORT: process.env.HTTPS_PORT,
              HTTPS_ADDRESS: process.env.HTTPS_ADDRESS,
              BASE_URI: process.env.BASE_URI,
            },
          },
          apiServices: {
            USER_SERVICE_URL: process.env.USER_SERVICE_URL,
          },
          authenticationConfig: {
            jwt: {
              JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
              JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
              JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN,
              JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
              JWT_ALGORITHM: process.env.JWT_ALGORITHM,
            },
            ldap: {
              LDAP_URL: process.env.LDAP_URL,
              LDAP_SEARCH_BASE: process.env.LDAP_SEARCH_BASE,
              LDAP_SEARCH_FILTER: process.env.LDAP_SEARCH_FILTER,
              LDAP_SERVICE_ACCOUNT_BIND_DN: process.env.LDAP_SERVICE_ACCOUNT_BIND_DN,
              LDAP_SERVICE_ACCOUNT_PASSWORD: process.env.LDAP_SERVICE_ACCOUNT_PASSWORD,
              LDAP_CERT: process.env.LDAP_CERT,
            },
          },
          mongodbConfig: {
            MONGO_REPLICA_SET_ID: process.env.MONGO_REPLICA_SET_ID,
            MONGO_HOST_PRIMARY: process.env.MONGO_HOST_PRIMARY,
            MONGO_PORT_PRIMARY: process.env.MONGO_PORT_PRIMARY,
            MONGO_HOST_SECONDARY_1: process.env.MONGO_HOST_SECONDARY_1, 
            MONGO_PORT_SECONDARY_1: process.env.MONGO_PORT_SECONDARY_1,
            MONGO_HOST_SECONDARY_2: process.env.MONGO_HOST_SECONDARY_2,
            MONGO_PORT_SECONDARY_2: process.env.MONGO_PORT_SECONDARY_2,
            MONGO_USERNAME: process.env.MONGO_USERNAME,
            MONGO_PASSWORD: process.env.MONGO_PASSWORD,
            MONGO_DB: process.env.MONGO_DB,
          },
          otherDBConfigs: {
            INTERVAL_CHECK_EXPIRED_TOKENS: parseInt(process.env.INTERVAL_CHECK_EXPIRED_TOKENS || 60 * 60 /* 1 hour */)
          }
        },
      };
    } catch (error) {
      console.error(`Error while <_getInitData> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _runWebServer = async  () => {
    try {
      const httpConfig = {
        port: this.initData.config.expressConfig.general.HTTP_PORT,
        ip: this.initData.config.expressConfig.general.HTTP_ADDRESS,
      };
      this.webserver = new WebServer(this.initData, httpConfig);
      await this.webserver.run();
    } catch (error) {
      console.error(`Error while <_runWebServer> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  }

  _syncDB = async () => {
    try {
      const mongodb = new MongoDB(this.initData.config.mongodbConfig);
      await mongodb.connectToReplicaSet();
    } catch (error) {
      console.error(`Error while <_syncDB> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _periodicalyCheckAndRemoveExpiredTokens = () => {
    const intervalTime = this.initData.config.otherDBConfigs.INTERVAL_CHECK_EXPIRED_TOKENS * 1000;
    setInterval(async () => {
      const durationString = this.initData.config.authenticationConfig.jwt.JWT_REFRESH_EXPIRES_IN
      const durationMilliseconds = ms(durationString);
      await RefreshToken.deleteExpiredTokens(durationMilliseconds);
    }, intervalTime);
  };
};

const app = new App();
app.run();