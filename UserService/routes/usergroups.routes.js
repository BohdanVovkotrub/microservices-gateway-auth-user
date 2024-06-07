const { Router } = require('express');
const ApiError = require('../exceptors/ApiError.js');
const Usergroup = require('../models/Usergroup.model.js');

const thisScriptPath = `routes/usergroup.routes.js`;


const createInlinePopulate = (param, select) => {
  const inlinePopulate = { path: param };
  if (select) {
    if (Array.isArray(select)) inlinePopulate.select = select.join(' ');
    if (typeof select === 'string') inlinePopulate.select = select;
  };
  return inlinePopulate;
};


class UsergroupsRouter {
  constructor() {
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    try {
      this.router.post('/', this.addNewUsergroup);
      this.router.get('/', this.getAllUsergroups);
      this.router.get('/:usergroupId', this.getOneUsergroupById);
      this.router.patch('/:usergroupId', this.updateOneUsergroup);
      this.router.delete('/:usergroupId', this.removeOneUsergroup);
    } catch (error) {
      console.error(`Error while <_initRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  addNewUsergroup = async (req, res, next) => {
    try {
      const createdUsergroup = await Usergroup.create(req.body);
      const responseData = {usergroup: createdUsergroup};
      return res.status(201).json(responseData);
    } catch (error) {
      next(error);
    }
  };

  getAllUsergroups = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const skip = (page - 1) * limit;

      /*** Query for select params:
        If you want to get an only `name` and `description`,
        add `?select[]=name&select[]=description` in URL query parameters.

        If you want to get everything except `createdAt`,
        add '-' before the parameter name f.e: `?select[]=-createdAt`

        Possible values: 
          name, users, roles, description, createdAt, updatedAt
      */
      
      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const names = req.query.names
                      ? Array.isArray(req.query.names) ? req.query.names : [String(req.query.name)]
                      : [];

      const searchQuery = names.length > 0 
                      ? { name: {$in: names.map(name => new RegExp(`^${name}$`, 'i'))} } 
                      : {};

      /***
        If you want to get the data of the users (populate users),
        add `?populate[]=users` in URL query parameters.

        Possible values for populate[]: 
          users, roles

        If you want to get the specific parameters of populated,
        For populated `users` add `usersSelect[]` with values as parameters names of model User (name, description and others).
        For others populated, the principle is the same.
        To exclude parameters use '-' before parameter
       */

      const inPopulate = req.query.populate
                      ? Array.isArray(req.query.populate) ? req.query.populate : [String(req.query.populate)]
                      : [];

      const populate = [];

      if (inPopulate.includes('users')) {
        populate.push(createInlinePopulate('users', req.query.usersSelect));
      };

      if (inPopulate.includes('roles')) {
        populate.push(createInlinePopulate('roles', req.query.rolesSelect));
      };

      const allUsergroups = await Usergroup.find(searchQuery)
        .select(select.join(' '))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(populate).exec();

      const totalCount = await Usergroup.countDocuments();

      const responseData = {
        allUsergroups,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalCount,
      };
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  };

  getOneUsergroupById = async (req, res, next) => {
    try {
      const usergroupId = req.params.usergroupId;
      if (!usergroupId) return next(ApiError.BadRequest());

      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const inPopulate = req.query.populate
                      ? Array.isArray(req.query.populate) ? req.query.populate : [String(req.query.populate)]
                      : [];

      const populate = [];

      if (inPopulate.includes('users')) {
        populate.push(createInlinePopulate('users', req.query.usersSelect));
      };

      if (inPopulate.includes('roles')) {
        populate.push(createInlinePopulate('roles', req.query.rolesSelect));
      };

      const usergroup = await Usergroup.findById(usergroupId)
        .select(select.join(' '))
        .populate(populate).exec();

      if (!usergroup) return next(ApiError.DataNotFound());

      const responseData = {usergroup};
      return res.status(200).send(responseData); 
    } catch (error) {
      next(error);
    }
  };

  updateOneUsergroup = async (req, res, next) => {
    try {
      const usergroupId = req.params.usergroupId;
      if (!usergroupId) return next(ApiError.BadRequest());

      const updatedUsergroup = await Usergroup.findByIdAndUpdate(usergroupId, req.body, {new: true});
      if (!updatedUsergroup) return next(ApiError.DataNotFound());

      const responseData = {updatedUsergroup};
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  }

  removeOneUsergroup = async (req, res, next) => {
    try {
      const usergroupId = req.params.usergroupId;
      if (!usergroupId) return next(ApiError.BadRequest());

      const deletedUsergroup = await Usergroup.findOneAndDelete({_id: usergroupId});
      if (!deletedUsergroup) return next(ApiError.DataNotFound());

      return res.status(204).end();
    } catch (error) {
      next(error);
    };
  };
};

module.exports = UsergroupsRouter;