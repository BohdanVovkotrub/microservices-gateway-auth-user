const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  refreshToken: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

refreshTokenSchema.statics.deleteExpiredTokens = async function(durationMilliseconds) {
  const expiredDate = new Date(Date.now() - durationMilliseconds);
  try {
    console.log(`Search for expired refreshToken tokens to delete ...`);
    const result = await this.deleteMany({ createdAt: { $lt: expiredDate } });
    console.log(`${result.deletedCount} expired tokens deleted`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error deleting expired tokens:", error);
    throw error;
  }
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;