class ConfigError extends Error {
  status;
  errors;

  constructor(message, errors = []) {
    super(message);
    this.errors = errors;
  };

  static parameterRequired(parameterName, errors = []) {
    return new ConfigError(`Parameter <${parameterName}> is not set but required.`, errors);
  };
};

module.exports = ConfigError