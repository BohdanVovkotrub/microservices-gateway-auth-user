const { Router } = require('express');
const isemail = require('isemail');
const ApiError = require('../exceptors/ApiError.js');
const User = require('../models/User.model.js');
const UserDto = require('../dtos/User.dto.js');


const thisScriptPath = `routes/user.routes.js`;

class AuthenticationRouter {
  constructor() {
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    try {
      this.router.post('/login', this.login);
    } catch (error) {
      console.error(`Error while <_initRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  login = async (req, res, next) => {
    try {
      const { name, password } = req.body;
      if (!name || !password) throw ApiError.BadRequest('<name> and <password> required.');

      const select = [...new Set(['enabled', 'name', 'password', ...req.query.select 
                        ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                        : []
                    ])];

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

      const searchQuery = isemail.validate(name) === true ? {email: name} : { name };

      const user = await User.findOne(searchQuery)
        .select(select.join(' '))
        .populate(populate).exec();

      if (!user) {
        throw ApiError.DataNotFound();
      };
      if (user.enabled !== true) {
        throw ApiError.DataNotFound();
      }
      const isValidPassword = await user.validatePassword(password);
      if (isValidPassword === false) {
        throw ApiError.UnathorizedError('Wrong password');
      };
      if (isValidPassword === true) {
        const responseData = {user: new UserDto(user)};
        return res.status(200).send(responseData);
      };
      return ApiError.InternalServerError('Something magical happened during <login>');
    } catch (error) {
      next(error);
    }
  };
};

module.exports = AuthenticationRouter;