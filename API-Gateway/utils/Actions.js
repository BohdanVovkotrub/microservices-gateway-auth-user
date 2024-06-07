const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

const thisScriptPath = `utils/Actions.js`;

class Actions {
  constructor(actionsData) {
    for (const [routerName, routes] of Object.entries(actionsData)) {
      this[routerName] = routes
    };
  };

  static readActionsJson = async () => {
    try {
      const filePath = path.join(__dirname, '..', 'data', 'actions-in-routes.json');
      const data = await fs.readFile(filePath, {encoding: 'utf-8'});
      const actionsData = JSON.parse(data);
      return new Actions(actionsData);
    } catch (error) {
      console.error(`Error while <_getActionsRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
}

class ActionsSyncronizer {
  constructor(USER_SERVICE_URL, actions) {
    this.USER_SERVICE_URL = USER_SERVICE_URL;
    this.actions = actions;
  };

  sync = async () => {
    try {
      const targetUrl = `${this.USER_SERVICE_URL}/api/v1/actions`;
      const responseGet = await axios.get(targetUrl);
      if (responseGet.status !== 200) {
        throw new Error('Failed fetch actions to syncronize.');
      };
      if (!Array.isArray(responseGet.data.allActions)) {
        throw new Error('<allActions> not provided while actions syncronize');
      }
      const actionsDb = responseGet.data.allActions.map(({name}) => name);
      const toCreate = [];

      for (const [service, routers] of Object.entries(this.actions)) {
        for (const [router, routes] of Object.entries(routers)) {
          for (const [route, actions] of Object.entries(routes)) {
            actions.forEach(action => {
              const isExist = actionsDb.includes(action);
              if (isExist !== true) {
                const { npm_package_name, npm_package_version } = process.env;
                toCreate.push({
                  name: action,
                  description: `Created by [${npm_package_name}@${npm_package_version}]; Use for router <${router}> of service <${service}> in route named <${route}>`,
                });
              };
            })
          };
        };
      };
      const responsePost = await axios.post(targetUrl, {bulkCreation: true, actions: toCreate});
      if (responsePost.status !== 201) {
        throw new Error('Failed to create actions');
      }
      console.log(`Syncronized actions for routes successfully!`);
      return responsePost.data;
    } catch (error) {
      console.error(`Error while <sync> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
};

module.exports = {
  Actions, 
  ActionsSyncronizer,
};