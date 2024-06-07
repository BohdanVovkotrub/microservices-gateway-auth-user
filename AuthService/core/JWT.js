const jwt = require('jsonwebtoken');

const thisScriptPath = `core/JWT.js`;

class JWT {
  constructor(jwtConfig) {
    this.JWT_ACCESS_SECRET = jwtConfig.JWT_ACCESS_SECRET;
    this.JWT_REFRESH_SECRET = jwtConfig.JWT_REFRESH_SECRET;
    this.JWT_ACCESS_EXPIRES_IN = jwtConfig.JWT_ACCESS_EXPIRES_IN;
    this.JWT_REFRESH_EXPIRES_IN = jwtConfig.JWT_REFRESH_EXPIRES_IN;
    this.JWT_ALGORITHM = jwtConfig.JWT_ALGORITHM;
  };

  generatePair = (payloadAccess, payloadRefresh) => {
    try {
      const accessToken = this.generateAccess(payloadAccess);
      const refreshToken = this.generateRefresh(payloadRefresh);
      return { accessToken, refreshToken };
    } catch (error) {
      console.error(`Error while <generatePair> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    };
  };

  generateAccess = (payloadAccess) => {
    try {
      const accessOptions = {
        secret: this.JWT_ACCESS_SECRET,
        expiresIn: this.JWT_ACCESS_EXPIRES_IN,
        algorithm: this.JWT_ALGORITHM,
      };
      const accessToken = JWT.generateToken(payloadAccess, accessOptions);
      return accessToken;
    } catch (error) {
      console.error(`Error while <generateAccess> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  generateRefresh = (payloadRefresh) => {
    try {
      const refreshOptions = {
        secret: this.JWT_REFRESH_SECRET,
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        algorithm: this.JWT_ALGORITHM,
      };
      const refreshToken = JWT.generateToken(payloadRefresh, refreshOptions);
      return refreshToken;
    } catch (error) {
      console.error(`Error while <generateRefresh> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  validateRefresh = (refreshToken) => {
    try {
      return jwt.verify(refreshToken, this.JWT_REFRESH_SECRET, {algorithms: [this.JWT_ALGORITHM]});
    } catch (error) {
      return null;
    };
  };

  validateAccess = (accessToken) => {
    try {
      return jwt.verify(accessToken, this.JWT_ACCESS_SECRET, {algorithms: [this.JWT_ALGORITHM]});
    } catch (error) {
      return null;
    };
  };

  static generateToken = (payload, {secret, expiresIn, algorithm}) => {
    return jwt.sign(payload, secret, { expiresIn, algorithm });
  };
};

module.exports = JWT;

