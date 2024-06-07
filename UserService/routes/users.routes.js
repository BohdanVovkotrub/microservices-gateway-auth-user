const { Router } = require('express');
const ApiError = require('../exceptors/ApiError.js');
const UserDto = require('../dtos/User.dto.js');
const User = require('../models/User.model.js');

const thisScriptPath = `routes/user.routes.js`;

const createInlinePopulate = (param, select) => {
  const inlinePopulate = { path: param };
  if (select) {
    if (Array.isArray(select)) inlinePopulate.select = select.join(' ');
    if (typeof select === 'string') inlinePopulate.select = select;
  };
  return inlinePopulate;
};

class UsersRouter {
  constructor() {
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    try {
      this.router.post('/', this.registerNewUser);
      this.router.get('/', this.getAllUsers);
      this.router.get('/:userId', this.getOneUserById);
      this.router.patch('/:userId', this.updateOneUser);
      this.router.delete('/:userId', this.removeOneUser);

      this.router.get('/:userId/roles', this.getAllUserRoles);
      this.router.get('/:userId/actions', this.getAllUserActions);
    } catch (error) {
      console.error(`Error while <_initRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  registerNewUser = async (req, res, next) => {
    try {
      const name = req.body.name;
      const createdUser = await User.create({name});
      const responseData = {user: new UserDto(createdUser)};
      return res.status(201).json(responseData);
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req, res, next) => {
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

      if (inPopulate.includes('roles')) {
        populate.push(createInlinePopulate('roles', req.query.rolesSelect));
      };

      const allUsers = await User.find(searchQuery)
        .select(select.join(' '))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(populate).exec();

      const totalCount = await User.countDocuments();

      const responseData = {
        allUsers: allUsers.map(user => new UserDto(user)),
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalCount,
      };
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  };

  getOneUserById = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());

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

      if (inPopulate.includes('roles')) {
        populate.push(createInlinePopulate('roles', req.query.rolesSelect));
      };

      const user = await User.findById(userId)
        .select(select.join(' '))
        .populate(populate).exec();
      if (!user) return next(ApiError.DataNotFound());

      const responseData = {user: new UserDto(user)};
      return res.status(200).send(responseData); 
    } catch (error) {
      next(error);
    }
  };

  updateOneUser = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());

      const updatedUser = await User.findOneAndUpdate({_id: userId}, req.body, {new: true});
      if (!updatedUser) return next(ApiError.DataNotFound());

      const responseData = {updatedUser: new UserDto(updatedUser)};
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    };
  }

  removeOneUser = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());

      const deletedUser = await User.findOneAndDelete({_id: userId});
      if (!deletedUser) return next(ApiError.DataNotFound());

      return res.status(204).end();
    } catch (error) {
      next(error);
    };
  };

  getAllUserRoles = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());

      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const populate = [
        {
          path: 'roles',
          select: select.join(' '),
        },
        {
          path: 'usergroups',
          select: 'roles',
          populate: {
            path: 'roles',
            select: select.join(' '),
          }
        }
      ];

      const user = await User.findById(userId)
        .select('roles usergroups')
        .populate(populate).exec();
      if (!user) return next(ApiError.DataNotFound());
      
      const userRoles = !!user.roles && Array.isArray(user.roles) ? user.roles : [];
      const usergroupRoles = !!user.usergroups && Array.isArray(user.usergroups)
        ? user.usergroups.flatMap(usergroup => (
            !!usergroup.roles && Array.isArray(usergroup.roles) ? usergroup.roles : []
          ))
        : [];

      const roles = new Map();
      userRoles.forEach(role => roles.set(String(role._id), role));
      usergroupRoles.forEach(role => roles.set(String(role._id), role))

      const responseData = {
        user: {
          _id: user._id,
          roles: [...roles.values()],
        },
      };
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  };

  getAllUserActions = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return next(ApiError.BadRequest());

      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const populate = [
        {
          path: 'roles',
          select: 'actions',
          populate: {
            path: 'actions',
            select: select.join(' '),
          }
        },
        {
          path: 'usergroups',
          select: 'roles',
          populate: {
            path: 'roles',
            select: 'actions',
            populate: {
              path: 'actions',
              select: select.join(' '),
            }
          }
        }
      ];

      const user = await User.findById(userId)
        .select('roles usergroups')
        .populate(populate).exec();
      if (!user) return next(ApiError.DataNotFound('User not found.'));

      const userRolesActions = !!user.roles && Array.isArray(user.roles)
        ? user.roles.flatMap(role => (
            !!role.actions && Array.isArray(role.actions) ? role.actions.map(action => action.name) : []
          ))
        : [];

      const usergroupRolesActions = !!user.usergroups && Array.isArray(user.usergroups)
        ? user.usergroups.flatMap(usergroup => (
            !!usergroup.roles && Array.isArray(usergroup.roles)
              ? usergroup.roles.flatMap(role => (
                !!role.actions && Array.isArray(role.actions) ? role.actions.map(action => action.name) : []
              ))
              : []
          ))
        : []; 

      const actions = [...new Set([...userRolesActions]), ...new Set([...usergroupRolesActions])];
      const responseData = {
        user: {
          _id: user._id,
          actions,
        },
      };
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  };
};

module.exports = UsersRouter;