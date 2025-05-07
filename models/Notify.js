"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
// const { Schema } = mongoose;
// TradeSuccess Schema (for /coin/api/trade-success)
const tradeSuccessSchema = new mongoose.Schema({
    tokenName: String,
    tradeType: String,
    marketCap: String,
    amount: String,
    createdAt: { type: Date, default: Date.now }, // Removed expires TTL
});
const TradeSuccess = mongoose.model("TradeSuccess", tradeSuccessSchema);
exports.default = TradeSuccess;
