"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;
const coinSchema = new Schema({
    creator: { type: ObjectId, ref: "User" },
    name: { type: String, required: true },
    ticker: { type: String, required: true },
    bondingCurve: { type: String, unique: true },
    description: { type: String },
    token: { type: String, unique: true },
    reserveOne: { type: Number, default: 1_000_000_000_000_000 },
    reserveTwo: { type: Number, default: 30_000_000_000 },
    url: { type: String, required: true },
    date: { type: Date, default: new Date() },
    imgUrl: { type: String, required: true },
    kothprogress: { type: Number, default: 0 },
    isCrown: { type: Boolean, default: false },
    time: { type: Date, default: Date.now },
});
const Coin = mongoose.model("Coin", coinSchema);
exports.default = Coin;
