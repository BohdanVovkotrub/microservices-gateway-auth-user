const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const isemail = require('isemail');
const ApiError = require('../exceptors/ApiError.js');

const SALT_WORK_FACTOR = 10;

function generateRandomPassword(length = 12) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseAlphabet = alphabet.toUpperCase();
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:",.<>?/`~';
  const combinedArray = [...alphabet, ...uppercaseAlphabet, ...numbers, ...symbols];
  const getRandomOne = () => combinedArray[Math.floor(Math.random() * combinedArray.length)];
  const password = new Array(length).map(getRandomOne).join('');
  return password;
};

async function hashPassword(password = '') {
  const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

const userSchema = new mongoose.Schema({
  enabled: {
    type: mongoose.Schema.Types.Boolean,
    default: true,
  },
  name: {
    type: String,
    match: /^(?!\\.)(?!.*\\.\\.)[a-zA-Z0-9\\.]{1,253}(?<!\\.)$/,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    match: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    default: "",
  },
  usergroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usergroup',
  }],
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
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

userSchema.methods.validatePassword = async function validatePassword(data) {
  return bcrypt.compare(data, this.password);
};

const addUserToUsergroups = async (userId, usergroups) => {
  return await mongoose.model('Usergroup').updateMany(
    { _id: { $in: usergroups } },
    { $addToSet: { users: userId } }
  );
};
const removeUserFromUsergroups = async (userId, usergroups = []) => {
  const findQuery = { users:  userId};
  if (usergroups.length > 0) findQuery._id = { $in: usergroups };
  return await mongoose.model('Usergroup').updateMany(
    findQuery,
    { $pull: { users: userId } }
  );
};
const addUserToRoles = async (userId, roles) => {
  return await mongoose.model('Role').updateMany(
    { _id: { $in: roles } },
    { $addToSet: { users: userId } }
  );
};
const removeUserFromRoles = async (userId, roles = []) => {
  const findQuery = { users:  userId};
  if (roles.length > 0) findQuery._id = { $in: roles };
  return await mongoose.model('Role').updateMany(
    findQuery,
    { $pull: { users: userId } }
  );
};
const handleChangedUsergroups = async (userId, oldUsergroups = [], updatedUsergroups = []) => {
  const removed = oldUsergroups.filter(oldUsergroup => !updatedUsergroups.includes(oldUsergroup));
  const added = updatedUsergroups.filter(updatedUsergroup => !oldUsergroups.includes(updatedUsergroup));
  if (removed.length > 0) await removeUserFromUsergroups(userId, removed);
  if (added.length > 0) await addUserToUsergroups(userId, added);
};
const handleChangedRoles = async (userId, oldRoles = [], updatedRoles = []) => {
  const removed = oldRoles.filter(oldRole => !updatedRoles.includes(oldRole));
  const added = updatedRoles.filter(updatedRole => !oldRoles.includes(updatedRole));
  if (removed.length > 0) await removeUserFromRoles(userId, removed);
  if (added.length > 0) await addUserToRoles(userId, added);
};

async function preSave(next) {
  try {
    this.set({ updatedAt: Date.now() });
    if (!this.password) {
      this.set({password: generateRandomPassword()});
    }
    if (this.isModified('password') === true) {
      const hashedPassword = await hashPassword(this.password);
      this.set({ password: hashedPassword });
    };
    return next();
  } catch (error) {
    next(error);
  }
};
async function postSave(savedUser, next) {
  try {
    if (!savedUser) return;
    if (Array.isArray(savedUser.usergroups) && savedUser.usergroups.length > 0)
      await addUserToUsergroups(savedUser._id, savedUser.usergroups);
    if (Array.isArray(savedUser.roles) && savedUser.roles.length > 0)
      await addUserToRoles(savedUser._id, savedUser.roles);
    next();
  } catch (error) {
    next(error);
  }
};
async function preFindOneAndUpdate() {
  const oldUser = await this.model.findOne(this.getQuery()); 
  if (!oldUser) throw ApiError.DataNotFound();
  this._oldUser = oldUser;
  const update = this.getUpdate();
  if (!!update.password) {
    const hashedPassword = await hashPassword(update.password);
    this.set({ password: hashedPassword });
  };
  this.set({ updatedAt: Date.now() });
};
async function postFindOneAndUpdate(updatedUser) {
  if (!updatedUser) return;
  await handleChangedUsergroups(updatedUser._id, this._oldUser.usergroups, updatedUser.usergroups);
  await handleChangedRoles(updatedUser._id, this._oldUser.roles, updatedUser.roles);
};
async function postFindOneAndDelete(deletedUser) {
  if (!deletedUser) return;
  await removeUserFromUsergroups(deletedUser._id);
  await removeUserFromRoles(deletedUser._id);
};

userSchema.pre('save', preSave);
userSchema.post('save', postSave);
userSchema.pre('findOneAndUpdate', preFindOneAndUpdate);
userSchema.post('findOneAndUpdate', postFindOneAndUpdate);
userSchema.post('findOneAndDelete', postFindOneAndDelete);


const User = mongoose.model('User', userSchema);

module.exports = User;