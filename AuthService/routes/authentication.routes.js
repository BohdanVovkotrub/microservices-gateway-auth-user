const { Router } = require('express');
const { LDAP } = require('../utils/LDAP.js');
const ApiError = require('../exceptors/ApiError.js');
const JWT = require('../core/JWT.js');
const RefreshToken = require('../models/RefreshToken.model.js');

class AuthenticationRouter {
  constructor(initData, passport, userService) {
    this.initData = initData;
    this.passport = passport;
    this.userService = userService;
    this.jwt = new JWT(this.initData.config.authenticationConfig.jwt);
    this.ldap = new LDAP(this.initData.config.authenticationConfig.ldap);
    this.router = new Router();
    this._initRoutes();
  };

  _initRoutes = () => {
    this.router.post('/verify-token', this.verifyToken);
    this.router.post('/refresh-token', this.refreshToken);
    this.router.post('/login/local', this.loginLocal);
    this.router.post('/login/ldap', this.loginLDAP);
    this.router.post('/logout', this.logout)
  };

  verifyToken = (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw ApiError.UnathorizedError();

      const accessToken = req.headers.authorization?.split(' ')[1];
      if (!accessToken) throw ApiError.UnathorizedError('No token provided.');

      const decoded = this.jwt.validateAccess(accessToken);
      if (decoded === null) throw ApiError.UnathorizedError();

      return res.status(200).send({authenticated: true, decoded});
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) throw ApiError.UnathorizedError('No token provided.');
      
      const deletedTokenDb = await RefreshToken.findOneAndDelete({refreshToken});
      if (!deletedTokenDb) throw ApiError.UnathorizedError();
      
      const decoded = this.jwt.validateRefresh(refreshToken);
      if (decoded === null) throw ApiError.UnathorizedError();
      
      const userId = decoded.userId;
      if (!userId) throw ApiError.UnathorizedError();
  
      const user = await this.userService.findUserById(userId);
      if (!user) throw ApiError.UnathorizedError(info);

      const payloadAccess = {user};
      const payloadRefresh = {userId: user._id};
      
      const tokens = this.jwt.generatePair(payloadAccess, payloadRefresh);

      try {
        await RefreshToken.create({refreshToken: tokens.refreshToken});
      } catch (error) {
        console.error('Failed to save token');
        throw ApiError.InternalServerError();
      }

      return res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  };

  loginLocal = (req, res, next) => {
    try {
      this.passport.passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) return next(err);
        if (!user) return next(ApiError.UnathorizedError());
        const payloadAccess = {user};
        const payloadRefresh = {userId: user._id};
        const tokens = this.jwt.generatePair(payloadAccess, payloadRefresh);
        try {
          await RefreshToken.create({refreshToken: tokens.refreshToken});
        } catch (error) {
          console.error('Failed to save token');
          next(ApiError.InternalServerError());
        }
        return res.status(200).json(tokens);
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  loginLDAP = async (req, res, next) => {
    try {
      const { name, password } = req.body;
      if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required' });
      }
      const user = await this.userService.findUserByName(name);
      console.log({user})
      if (!user || user.enabled !== true) return next(ApiError.DataNotFound());

      this.passport.passport.authenticate('ldap', { session: false }, async (err, ldapUser, info) => {
        if (err) {
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        if (!ldapUser) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        const payloadAccess = {user};
        const payloadRefresh = {userId: user._id};
        const tokens = this.jwt.generatePair(payloadAccess, payloadRefresh);
        try {
          await RefreshToken.create({refreshToken: tokens.refreshToken});
        } catch (error) {
          console.error('Failed to save token');
          throw ApiError.InternalServerError();
        }
        return res.status(200).json(tokens);
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      if (!refreshToken) throw ApiError.UnathorizedError('No token provided.');
      await RefreshToken.findOneAndDelete({refreshToken});
      return res.status(204).end();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = AuthenticationRouter;