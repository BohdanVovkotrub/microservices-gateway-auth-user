const mongoose = require('mongoose');
const ApiError = require('../exceptors/ApiError.js');

const usergroupSchema = new mongoose.Schema({
  name: {
    type: String,
    match: /^(?=.{1,63}$)[a-zA-Z0-9 _.-]+$/,
    required: true,
    unique: true,
  },
  users: [
    { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },  
  ],
  roles: [
    { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },  
  ],
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



const addUsergroupToUsers = async (usergroupId, users) => {
  return await mongoose.model('User').updateMany(
    { _id: { $in: users } },
    { $addToSet: { usergroups: usergroupId } }
  );
};
const removeUsergroupFromUsers = async (usergroupId, users = []) => {
  const findQuery = { usergroups:  usergroupId};
  if (users.length > 0) findQuery._id = { $in: users };
  return await mongoose.model('Usergroup').updateMany(
    findQuery,
    { $pull: { usergroups:  usergroupId} }
  );
};
const addUsergroupToRoles = async (usergroupId, roles) => {
  return await mongoose.model('Role').updateMany(
    { _id: { $in: roles } },
    { $addToSet: { usergroups: usergroupId } }
  );
};
const removeUsergroupFromRoles = async (usergroupId, roles = []) => {
  const findQuery = { usergroups:  usergroupId};
  if (roles.length > 0) findQuery._id = { $in: roles };
  return await mongoose.model('Role').updateMany(
    findQuery,
    { $pull: { usergroups:  usergroupId} }
  );
};
const handleChangedUsers = async (usergroupId, oldUsers = [], updatedUsers = []) => {
  const removed = oldUsers.filter(oldUser => !updatedUsers.includes(oldUser));
  const added = updatedUsers.filter(updatedUser => !oldUsers.includes(updatedUser));
  if (removed.length > 0) await removeUsergroupFromUsers(usergroupId, removed);
  if (added.length > 0) await addUsergroupToUsers(usergroupId, added);
};
const handleChangedRoles = async (usergroupId, oldRoles = [], updatedRoles = []) => {
  const removed = oldRoles.filter(oldRole => !updatedRoles.includes(oldRole));
  const added = updatedRoles.filter(updatedRole => !oldRoles.includes(updatedRole));
  if (removed.length > 0) await removeUsergroupFromRoles(usergroupId, removed);
  if (added.length > 0) await addUsergroupToRoles(usergroupId, added);
};

async function preSave(next) {
  try {
    this.set({ updatedAt: Date.now() });
    return next();
  } catch (error) {
    return next(error);
  }
};
async function postSave(savedUsergroup, next) {
  try {
    if (!savedUsergroup) return;
    if (Array.isArray(savedUsergroup.users) && savedUsergroup.users.length > 0)
      await addUsergroupToUsers(savedUsergroup._id, savedUsergroup.users);
    if (Array.isArray(savedUsergroup.roles) && savedUsergroup.roles.length > 0)
      await addUsergroupToRoles(savedUsergroup._id, savedUsergroup.roles);
    return next();
  } catch (error) {
    return next(error);
  }
};
async function preFindOneAndUpdate() {
  const oldUsergroup = await this.model.findOne(this.getQuery()); 
  if (!oldUsergroup) throw ApiError.DataNotFound();
  this._oldUsergroup = oldUsergroup;
  this.set({ updatedAt: Date.now() });
};
async function postFindOneAndUpdate(updatedUsergroup) {
  if (!updatedUsergroup) return;
  await handleChangedUsers(updatedUsergroup._id, this._oldUsergroup.users, updatedUsergroup.users);
  await handleChangedRoles(updatedUsergroup._id, this._oldUsergroup.roles, updatedUsergroup.roles);
};
async function postFindOneAndDelete(deletedUsergroup) {
  if (!deletedUsergroup) return;
  await removeUsergroupFromUsers(deletedUsergroup._id);
  await removeUsergroupFromRoles(deletedUsergroup._id);
};

usergroupSchema.pre('save', preSave);
usergroupSchema.post('save', postSave);
usergroupSchema.pre('findOneAndUpdate', preFindOneAndUpdate);
usergroupSchema.post('findOneAndUpdate', postFindOneAndUpdate);
usergroupSchema.post('findOneAndDelete', postFindOneAndDelete);

const Usergroup = mongoose.model('Usergroup', usergroupSchema);

module.exports = Usergroup;