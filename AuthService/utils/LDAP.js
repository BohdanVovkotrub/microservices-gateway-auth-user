const ActiveDirectory = require('activedirectory');
const ApiError = require('../exceptors/ApiError.js');

const thisScriptPath = `utils/LDAP.js`;

class LdapError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  };

  static parse = (err) => {
    try {
      const codes =  {
        '525': 'ERROR LDAP 525: User not found',
        '52e': 'ERROR LDAP 52e: Invalid credentials. Wrong password',
        '530': 'ERROR LDAP 530: Not permitted to logon at this time.',
        '531': 'ERROR LDAP 531: Not permitted to logon from this workstation.',
        '532': 'ERROR LDAP 532: Password expired.',
        '533': 'ERROR LDAP 533: Account disabled.',
        '701': 'ERROR LDAP 701: Account expired.',
        '773': 'ERROR LDAP 773: User must reset password.',
        '775': 'ERROR LDAP 775: Account locked out.',
      };
      const splited = err.lde_message.split(',')[2].split(' ');
      const idx = splited.findIndex(code => typeof codes[code] !== 'undefined');
      return (idx !== -1) 
      ? new LdapError(splited[idx], codes[splited[idx]])
      : new LdapError(String(idx), 'Unknown error code');
    } catch (error) {
      console.error(`Error while <parse> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  convertToApiError = () => {
    try {
      if (this.code === '525')
        return ApiError.DataNotFound(this.message);
      if (this.code === '52e')
        return ApiError.BadRequest(this.message);
      if (this.code === String(-1))
        return ApiError.InternalServerError(this.message);
      return ApiError.UnathorizedError(this.message);
    } catch (error) {
      console.error(`Error while <convertToApiError> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
};

class LDAP {
  constructor(ldapConfig) {
    this.config = {
      url: ldapConfig.LDAP_URL,
      baseDN: ldapConfig.LDAP_BASE_DN,
      bindDN: ldapConfig.LDAP_BIND_DN,
      username_suffix: ldapConfig.LDAP_USERNAME_SUFFIX,
      tlsOptions: { rejectUnauthorized: false },
    };
    
    this.ad = new ActiveDirectory(this.config);
  };

  authenticateUser = async (name, password) => {
    console.log(this.config, this.ad)
    const username = `${name}@${this.config.username_suffix}`;
    return new Promise((resolve, reject) => {
      this.ad.authenticate(username, password, async (err, auth) => {
        if (err) {
          reject(LdapError.parse(err));
        }
        resolve(auth);
      });
    });
  };
};


module.exports = {
  LDAP,
  LdapError,
};



