require('dotenv').config();
const MongoDB = require('./core/MongoDB.js');
const WebServer = require('./utils/WebServer.js');
const dbSyncDefaults = require('./utils/dbSyncDefaults.js');

const thisScriptPath = `./index.js`;

class App {
  initData;
  webserver;

  constructor() {};

  run = async () => {
    try {
      this._showWhoIam();
      this._getInitData();
      await this._syncDB();
      await this._runWebServer();
    } catch (error) {
      console.error(`Error while <run> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
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
            apiServices: {
              // USER_SERVICE_URL: process.env.USER_SERVICE_URL,
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
        },
      };
    } catch (error) {
      console.error(`Error while <_getInitData> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  _syncDB = async () => {
    try {
      const mongodb = new MongoDB(this.initData.config.mongodbConfig);
      await mongodb.connectToReplicaSet();
      await dbSyncDefaults();
    } catch (error) {
      console.error(`Error while <_syncDB> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
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
};

try {
  const app = new App();
  app.run();
} catch (error) {
  console.error('APP CRASHED:', error.message);
}
