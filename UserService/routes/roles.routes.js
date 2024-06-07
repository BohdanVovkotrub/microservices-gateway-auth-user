const { Router } = require('express');
const { MongooseError }  = require('mongoose');
const ApiError = require('../exceptors/ApiError.js');
const Role = require('../models/Role.model.js');

const thisScriptPath = `routes/usergroup.routes.js`;

const createInlinePopulate = (param, select) => {
  const inlinePopulate = { path: param };
  if (select) {
    if (Array.isArray(select)) inlinePopulate.select = select.join(' ');
    if (typeof select === 'string') inlinePopulate.select = select;
  };
  return inlinePopulate;
};


class RoleRouter {
  constructor() {
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    try {
      this.router.post('/', this.addNewRole);
      this.router.get('/', this.getAllRoles);
      this.router.get('/:roleId', this.getOneRoleById);
      this.router.patch('/:roleId', this.updateOneRole);
      this.router.delete('/:roleId', this.removeOneRole);
    } catch (error) {
      console.error(`Error while <_initRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  addNewRole = async (req, res, next) => {
    try {
      const createdRole = await Role.create(req.body);
      const responseData = {role: createdRole};
      return res.status(201).json(responseData);
    } catch (error) {
      next(error);
    }
  };

  getAllRoles = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;

      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const names = req.query.names
                      ? Array.isArray(req.query.names) ? req.query.names : [String(req.query.name)]
                      : [];
      
      const searchQuery = names.length > 0 
                      ? { name: {$in: names.map(name => new RegExp(`^${name}$`, 'i'))} } 
                      : {};

      const inPopulate = req.query.populate
                      ? Array.isArray(req.query.populate) ? req.query.populate : [String(req.query.populate)]
                      : [];

      const populate = [];

      if (inPopulate.includes('usergroups')) {
        populate.push(createInlinePopulate('usergroups', req.query.usergroupsSelect));
      };

      if (inPopulate.includes('users')) {
        populate.push(createInlinePopulate('users', req.query.usersSelect));
      };

      if (inPopulate.includes('actions')) {
        populate.push(createInlinePopulate('actions', req.query.actionsSelect));
      };

      const allRoles = await Role.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .select(select.join(' '))
        .limit(limit)
        .populate(populate).exec();

      const totalCount = await Role.countDocuments();

      const responseData = {
        allRoles,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalCount,
      };
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  };

  getOneRoleById = async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      if (!roleId) return next(ApiError.BadRequest());

      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const inPopulate = req.query.populate
                      ? Array.isArray(req.query.populate) ? req.query.populate : [String(req.query.populate)]
                      : [];

      const populate = [];

      if (inPopulate.includes('usergroups')) {
        populate.push(createInlinePopulate('usergroups', req.query.usergroupsSelect));
      };

      if (inPopulate.includes('users')) {
        populate.push(createInlinePopulate('users', req.query.usersSelect));
      };

      if (inPopulate.includes('actions')) {
        populate.push(createInlinePopulate('actions', req.query.actionsSelect));
      };

      const role = await Role.findById(roleId)
        .select(select.join(' '))
        .populate(populate).exec();
      if (!role) return next(ApiError.DataNotFound());

      const responseData = {role};
      return res.status(200).send(responseData); 
    } catch (error) {
      next(error);
    }
  };

  updateOneRole = async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      if (!roleId) return next(ApiError.BadRequest());

      const updatedRole = await Role.findOneAndUpdate({_id: roleId}, req.body, {new: true});
      if (!updatedRole) return next(ApiError.DataNotFound());

      const responseData = {updatedRole};
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  }

  removeOneRole = async (req, res, next) => {
    try {
      const roleId = req.params.roleId;
      if (!roleId) return next(ApiError.BadRequest());

      const deletedRole = await Role.findOneAndDelete({_id: roleId});
      if (!deletedRole) return next(ApiError.DataNotFound());

      return res.status(204).end();
    } catch (error) {
      next(error);
    };
  };
};

module.exports = RoleRouter;