const fs = require('fs/promises');
const path = require('path');
const User = require('../models/User.model.js');
const Usergroup = require('../models/Usergroup.model.js');
const Role = require('../models/Role.model.js');
const Action = require('../models/Action.model.js');

const thisScriptPath = `utils/dbSyncDefaults.js`;
const { npm_package_name, npm_package_version } = process.env;

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

async function createDefaultActions() {
  try {
    const allDefaultActions = await Actions.readActionsJson();
    const actionsDb = await Action.find();
    const toCreate = [];
    Object.entries(allDefaultActions).forEach(([router, routes]) => {
      Object.entries(routes).forEach(([route, actions]) => {
        actions.forEach(action => {
          const isExist = actionsDb.map(({name}) => name).includes(action);
          if (!(isExist === true)) {
            const { npm_package_name, npm_package_version } = process.env;
            toCreate.push({
              name: action,
              description: `Created by [${npm_package_name}@${npm_package_version}]; Use for router <${router}> in route named <${route}>`,
            });
          };
        })
      })
    });
    const uniqToCreate = toCreate.filter((action, idx, self) => idx === self.findIndex(tmpItem => tmpItem.name === action.name));
    const createdActions = await Action.insertMany(uniqToCreate);
    if (!!createdActions && createdActions.length > 0) {
      console.log(`Created <${createdActions.length}> default actions in DB.`);
    }
    return createdActions;
  } catch (error) {
    console.error(`Error while <createDefaultActions> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
    throw error;
  }
};
async function createAdminRole() {
  try {
    const roleName = 'Administrator';
    const existingAdminRole = await Role.findOne({ name: roleName });
    if (!existingAdminRole) {
      const adminRole = await Role.create({ 
        name: roleName,
        description: `Created by [${npm_package_name}@${npm_package_version}]. It is default administrator role.`,
      });
      return adminRole;
    };
    return existingAdminRole;
  } catch (error) {
    console.error(`Error while <createAdminRole> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
    throw error;
  }
};
async function updateActionsInAdminRole(adminRole) {
  try {
    const allActionsDB = await Action.find();
    adminRole.actions = [...new Set([...adminRole.actions, ...allActionsDB.map(({_id}) => _id)])];
    await adminRole.save();
  } catch (error) {
    console.error(`Error while <updateActionsInAdminRole> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
    throw error;
  }
};
async function createAdminGroup(adminRole) {
  const usergroupName = 'Administrators';
  const existingAdminGroup = await Usergroup.findOne({ name: usergroupName });

  if (!existingAdminGroup) {
    const adminGroup = await Usergroup.create({ 
      name: usergroupName,
      roles: [
        adminRole._id,
      ],
      description: `Created by [${npm_package_name}@${npm_package_version}]. It is default administrator user group.`,
    });
    return adminGroup;
  };

  if (!existingAdminGroup.roles.includes(adminRole._id)) {
    existingAdminGroup.roles = [...new Set([...existingAdminGroup.roles, adminRole._id])];
    await existingAdminGroup.save();
  };

  return existingAdminGroup;
}
async function createAdminUser(adminGroup, adminRole) {
  const credentials = { name: 'admin', password: 'admin' };
  const existingAdminUser = await User.findOne({ name: credentials.name });

  if (!existingAdminUser) {
    const adminUser = await User.create({ 
      name: credentials.name,
      password: credentials.password,
      usergroups: [
        adminGroup._id,
      ],
      roles: [
        adminRole._id,
      ],
      description: `Created by [${npm_package_name}@${npm_package_version}]. It is default administrator user.`,
    });
    return adminUser;
  };

  if (!existingAdminUser.usergroups.includes(adminGroup._id)) {
    existingAdminUser.usergroups = [...new Set([...existingAdminUser.usergroups, adminGroup._id])];
    await existingAdminUser.save();
  };

  if (!existingAdminUser.roles.includes(adminRole._id)) {
    existingAdminUser.roles = [...new Set([...existingAdminUser.roles, adminRole._id])];
    await existingAdminUser.save();
  };

  return existingAdminUser;
}

async function dbSyncDefaults() {
  try {
    await createDefaultActions();
    const adminRole = await createAdminRole();
    await updateActionsInAdminRole(adminRole);
    const adminGroup = await createAdminGroup(adminRole);
    await createAdminUser(adminGroup, adminRole);

    console.log('Sync defaults in DB completed');
    return true;
  } catch (error) {
    console.error(`Cannot sync defaults in DB: ${error.message}`);
    return false;
  }
}

module.exports = dbSyncDefaults;
