const { Router } = require('express');
const ApiError = require('../exceptors/ApiError.js');

class AuthorizationRouter {
  constructor(initData, userService) {
    this.initData = initData;
    this.userService = userService;
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    this.router.post('/authorize-actions', this.authorizeActions);
  };

  authorizeActions = async (req, res, next) => {
    try {
      const userId = req.body.userId
      if (!userId) return next(ApiError.BadRequest('<userId> is not provided.'));

      const checkActions = req.body.checkActions;

      if (!checkActions || !Array.isArray(checkActions)) {
        return next(ApiError.BadRequest('<checkActions> is not provided or is not an Array.'));
      }

      const { actions } = await this.userService.getAllUserActions(userId);

      const isAuthorized = checkActions.every(checkAction => actions.includes(checkAction));

      if (isAuthorized !== true) {
        return next(ApiError.Forbidden());
      }

      return res.status(200).send({ isAuthorized });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = AuthorizationRouter;

