class UserDto {
  constructor(user) {
    this._id = user._id;
    this.enabled = user.enabled;
    this.name = user.name;
    this.email = user.email;
    this.roles = user.roles;
    this.usergroups = user.usergroups;
    this.description = user.description;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  };
};

module.exports = UserDto;