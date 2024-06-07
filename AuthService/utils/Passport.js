const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const LdapStrategy = require('passport-ldapauth').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const UserService = require('./UserService.js');

const thisScriptPath = `utils/Passport.js`;


class Passport {
  constructor(userService) {
    this.passport = passport;
    this.userService = userService;
  };

  useLocalStrategy = () => {
    try {
      this.passport.use('local', new LocalStrategy({
        usernameField: 'name',
        passwordField: 'password',
      },
         async (name, password, done) => {
          try {
            const user = await this.userService.login(name, password);
            if (!user || user.enabled !== true) return done(null, false);
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      ));
    } catch (error) {
      console.error(`Error while <useLocalStrategy> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  useLdapStrategy = (ldapConfig) => {
    try {
      const tlsOptions = !ldapConfig.LDAP_CERT 
      ? { rejectUnauthorized: false }
      : { ca: [ fs.readFileSync(String(ldapConfig.LDAP_CERT).trim())] };
      
      this.passport.use('ldap', new LdapStrategy({
        server: {
          url: ldapConfig.LDAP_URL,
          bindDN: ldapConfig.LDAP_SERVICE_ACCOUNT_BIND_DN,
          bindCredentials: ldapConfig.LDAP_SERVICE_ACCOUNT_PASSWORD,
          searchBase: ldapConfig.LDAP_SEARCH_BASE,
          searchFilter: ldapConfig.LDAP_SEARCH_FILTER,
          tlsOptions,
          searchAttributes: ['dn', 'cn', 'mail', 'sAMAccountName'],
        },
        usernameField: 'name',
        passwordField: 'password',
      }, async (ldapUser, done) => {
        if (!ldapUser) return done(null, false);
        return done(null, ldapUser);
      }));
    } catch (error) {
      console.error(`Error while <useLdapStrategy> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  useSerializeUser = () => {
    try {
      this.passport.serializeUser((user, done) => {
        done(null, user.id);
      });
    } catch (error) {
      console.error(`Error while <useSerialize> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  useDeserializeUser = () => {
    try {
      this.passport.deserializeUser(async (id, done) => {
        const user = await this.userService.findUserById(id);
        done(null, user);
      });
    } catch (error) {
      console.error(`Error while <useDeserializeUser> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };

  initialize = () => {
    try {
      const init = this.passport.initialize();
      return init;
    } catch (error) {
      console.error(`Error while <initialize> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
  
  session = () => {
    try {
      return this.passport.session();
    } catch (error) {
      console.error(`Error while <session> in class <${this.constructor.name}> in script <${thisScriptPath}>:`, error?.message);
      throw error;
    }
  };
};


module.exports = Passport;