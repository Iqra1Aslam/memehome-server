"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    name: { type: String },
    wallet: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);
exports.default = User;
