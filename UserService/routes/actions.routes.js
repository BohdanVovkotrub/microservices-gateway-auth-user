const { Router } = require('express');
const ApiError = require('../exceptors/ApiError.js');
const Action = require('../models/Action.model.js');

const thisScriptPath = `routes/usergroup.routes.js`;

class ActionRouter {
  constructor() {
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    try {
      this.router.post('/', this.addNewAction);
      this.router.get('/', this.getAllActions);
      this.router.get('/:actionId', this.getOneActionById);
      this.router.patch('/:actionId', this.updateOneAction);
      this.router.delete('/:actionId', this.removeOneAction);
    } catch (error) {
      console.error(`Error while <_initRoutes> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  addNewAction = async (req, res, next) => {
    try {
      const bulkCreation = req.body.bulkCreation;
      if (bulkCreation === true) {
        const actions = req.body.actions;
        if (!Array.isArray(actions)) return next(ApiError.BadRequest('<actions> not provided or is not an array.'));
        const createdActions = await Action.insertMany(actions);
        const responseData = {createdActions};
        return res.status(201).send(responseData);
      };
      const createdAction = await Action.create(req.body);
      const responseData = {action: createdAction};
      return res.status(201).json(responseData);
    } catch (error) {
      next(error);
    }
  };

  getAllActions = async (req, res, next) => {
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

      const allActions = await Action.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .select(select.join(' '))
        .limit(limit);

      const totalCount = await Action.countDocuments();

      const responseData = {
        allActions,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        totalCount,
      };
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  };

  getOneActionById = async (req, res, next) => {
    try {
      const actionId = req.params.actionId;
      if (!actionId) return next(ApiError.BadRequest());

      const select = req.query.select 
                      ? Array.isArray(req.query.select) ? req.query.select : [String(req.query.select)]
                      : [];

      const action = await Action.findById(actionId).select(select.join(' '));
      if (!action) return next(ApiError.DataNotFound());

      const responseData = {action};
      return res.status(200).send(responseData); 
    } catch (error) {
      next(error);
    }
  };

  updateOneAction = async (req, res, next) => {
    try {
      const actionId = req.params.actionId;
      if (!actionId) return next(ApiError.BadRequest());

      const updatedAction = await Action.findByIdAndUpdate(actionId, req.body, {new: true});
      if (!updatedAction) return next(ApiError.DataNotFound());

      const responseData = {updatedAction};
      return res.status(200).send(responseData);
    } catch (error) {
      next(error);
    }
  }

  removeOneAction = async (req, res, next) => {
    try {
      const actionId = req.params.actionId;
      if (!actionId) return next(ApiError.BadRequest());

      const deletedAction = await Action.findOneAndDelete({_id: actionId});
      if (!deletedAction) return next(ApiError.DataNotFound());

      return res.status(204).end();
    } catch (error) {
      next(error);
    };
  };
};

module.exports = ActionRouter;