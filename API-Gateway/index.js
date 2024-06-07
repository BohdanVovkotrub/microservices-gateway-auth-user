require('dotenv').config();
const WebServer = require('./utils/WebServer.js');

const thisScriptPath = `./index.js`;

class App {
  initData;
  webserver;

  constructor() {};

  run = async () => {
    this._showWhoIam();
    this._getInitData();
    await this._runWebServer();
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
              AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
              USER_SERVICE_URL: process.env.USER_SERVICE_URL,
              SPEECHES_SERVICE_URL: process.env.SPEECHES_SERVICE_URL,
              // LOCAL_SPEECH2TEXT_WHISPERX_SERVICE_URL: process.env.LOCAL_SPEECH2TEXT_WHISPERX_SERVICE_URL,
            },
            passport: {
              JWT_SECRET: process.env.JWT_SECRET,
            }
          },
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

const app = new App();
app.run();