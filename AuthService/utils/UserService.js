const axios = require('axios');
const { ApiError } = require('../core/ExpressApp');

const thisScriptPath = `utils/UserService.js`;

class UserService {
  constructor(USER_SERVICE_URL) {
    this.USER_SERVICE_URL = USER_SERVICE_URL;
  };

  login = async (name, password) => {
    try {
      try {
        const response = await axios.post(`${this.USER_SERVICE_URL}/api/v1/authentication/login?select[]=email`, { name, password });
        if (response.status === 200) {
          const {user} = response.data || {user: null};
          return user;
        }
        return null;
      } catch (error) {
        return null;
      };
    } catch (error) {
      console.error(`Error while <login> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  findUserById = async (userId) => {
    try {
      const response = await axios.get(`${this.USER_SERVICE_URL}/api/v1/users/${userId}`);
      if (response.status === 200) {
        const {user} = response.data || {user: null};
        return user;
      }
      throw ApiError.DataNotFound();
    } catch (error) {
      console.error(`Error while <findById> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  findUserByName = async (name) => {
    try {
      const response = await axios.get(`${this.USER_SERVICE_URL}/api/v1/users?names[]=${name}&limit=1&select[]=name&select[]=enabled&select[]=email`);
      if (response.status === 200) {
        const user = response.data.allUsers[0];
        return user;
      }
      throw ApiError.DataNotFound();
    } catch (error) {
      console.error(`Error while <findByName> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };


  getAllUserActions = async (userId) => {
    try {
      const response = await axios.get(`${this.USER_SERVICE_URL}/api/v1/users/${userId}/actions`);
      if (response.status === 200) {
        const user = response.data.user;
        if (!user) throw ApiError.InternalServerError('Failed to fetch user');
        if (!user.actions || !Array.isArray(user.actions)) 
          throw ApiError.InternalServerError('Failed to fetch user actions');
        return user;
      }
      throw ApiError.DataNotFound();
    } catch (error) {
      console.error(`Error while <getAllUserActions> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    };
  };
};


module.exports = UserService;