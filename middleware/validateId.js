const mongoose = require("mongoose");
const validateMongoId = (id) => {
  const isValidId = mongoose.Types.ObjectId.isValid(id);
  if (!isValidId) throw new Error("This is not valid or not found");
};

module.exports = validateMongoId;
