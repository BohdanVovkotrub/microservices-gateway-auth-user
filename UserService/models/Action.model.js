const mongoose = require('mongoose');
const ApiError = require('../exceptors/ApiError.js');

const actionSchema = new mongoose.Schema({
  name: {
    type: String,
    match: /^(?=.{1,63}$)[a-zA-Z0-9 _.-]+$/,
    required: true,
    unique: true,
  },
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

const setUpdatedAtNow = function(next) {
  this.set({ updatedAt: Date.now() });
  next();
};
const postSave = async function(error, _, next) {
  if (!!error) {
    if (error.code === 11000) {
      return next(ApiError.Conflict('This item already exist.'));
    }
    return next(ApiError.InternalServerError());
  };
};

actionSchema.pre('save', setUpdatedAtNow);
actionSchema.pre('findOneAndUpdate', setUpdatedAtNow);
actionSchema.post('save', postSave);

const Action = mongoose.model('Action', actionSchema);

module.exports = Action;