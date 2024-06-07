const mongoose = require('mongoose');
const ApiError = require('../exceptors/ApiError.js');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    match: /^(?=.{1,63}$)[a-zA-Z0-9 _.-]+$/,
    required: true,
    unique: true,
  },
  actions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Action',
  }],
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  usergroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usergroup',
  }],
  description: {
    type: String,
    match: /^.{0,1024}$/,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const addRoleToUsergroups = async (roleId, usergroups) => {
  return await mongoose.model('Usergroup').updateMany(
    { _id: { $in: usergroups } },
    { $addToSet: { roles: roleId } }
  );
};
const removeRoleFromUsergroups = async (roleId, usergroups = []) => {
  const findQuery = { roles:  roleId};
  if (usergroups.length > 0) findQuery._id = { $in: usergroups };
  return await mongoose.model('Usergroup').updateMany(
    findQuery,
    { $pull: { roles: roleId } }
  );
};
const addRoleToUsers = async (roleId, users) => {
  return await mongoose.model('User').updateMany(
    { _id: { $in: users } },
    { $addToSet: { roles: roleId } }
  );
};
const removeRoleFromUsers = async (roleId, users = []) => {
  const findQuery = { roles:  roleId};
  if (users.length > 0) findQuery._id = { $in: users };
  return await mongoose.model('User').updateMany(
    findQuery,
    { $pull: { roles: roleId } }
  );
};
const handleChangedUsergroups = async (roleId, oldUsergroups = [], updatedUsergroups = []) => {
  const removed = oldUsergroups.filter(oldUsergroup => !updatedUsergroups.includes(oldUsergroup));
  const added = updatedUsergroups.filter(updatedUsergroup => !oldUsergroups.includes(updatedUsergroup));
  if (removed.length > 0) await removeRoleFromUsergroups(roleId, removed);
  if (added.length > 0) await addRoleToUsergroups(roleId, added);
};
const handleChangedUsers = async (roleId, oldUsers = [], updatedUsers = []) => {
  const removed = oldUsers.filter(oldUser => !updatedUsers.includes(oldUser));
  const added = updatedUsers.filter(updatedUser => !oldUsers.includes(updatedUser));
  if (removed.length > 0) await removeRoleFromUsers(roleId, removed);
  if (added.length > 0) await addRoleToUsers(roleId, added);
};
const preSave = async function() {
  this.set({ updatedAt: Date.now() });
};
const postSave = async function(savedRole, next) {
  try {
    if (!savedRole) return;
    if (Array.isArray(savedRole.usergroups) && savedRole.usergroups.length > 0) 
      await addRoleToUsergroups(savedRole._id, savedRole.usergroups);
    if (Array.isArray(savedRole.users) && savedRole.users.length > 0) 
      await addRoleToUsers(savedRole._id, savedRole.users);
    return next();
  } catch (error) {
    return next(error);
  }
};
const preFindOneAndUpdate = async function() {
  const oldRole = await this.model.findOne(this.getQuery()); 
  if (!oldRole) throw ApiError.DataNotFound();
  this._oldRole = oldRole;
  this.set({ updatedAt: Date.now() });
};
const postFindOneAndUpdate = async function(updatedRole) {
  if (!updatedRole) return;
  await handleChangedUsergroups(updatedRole._id, this._oldRole.usergroups, updatedRole.usergroups);
  await handleChangedUsers(updatedRole._id, this._oldRole.users, updatedRole.users);
};
const postFindOneAndDelete = async function(deletedRole) {
  if (!deletedRole) return;
  await removeRoleFromUsergroups(deletedRole._id);
  await removeRoleFromUsers(deletedRole._id);
};

roleSchema.pre('save', preSave);
roleSchema.post('save', postSave);
roleSchema.pre('findOneAndUpdate', preFindOneAndUpdate);
roleSchema.post('findOneAndUpdate', postFindOneAndUpdate);
roleSchema.post('findOneAndDelete', postFindOneAndDelete);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;