"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Coin_1 = __importDefault(require("../../models/Coin"));
const trade_1 = require("../../models/trade");
const web3_1 = require("../../program/web3");
const router = (0, express_1.Router)();
//ably
router.post("/api/trades", async (req, res) => {
    const tradeData = req.body;
    let checkRaydium = null;
    const coinId = await Coin_1.default.findOne({ token: tradeData.tokenAddress })
        .select("_id")
        .populate("creator");
    if (!tradeData.account ||
        !tradeData.type ||
        !tradeData.tokenAmount ||
        !tradeData.solAmount ||
        !tradeData.txHex ||
        !tradeData.tokenAddress) {
        return res.status(400).json({
            error: "Missing required fields",
            required: [
                "account",
                "type",
                "tokenAmount",
                "solAmount",
                "txHex",
                "tokenAddress",
            ],
        });
    }
    const tradeInput = {
        account: tradeData.account,
        type: tradeData.type,
        tokenAmount: tradeData.tokenAmount,
        solAmount: tradeData.solAmount,
        txHex: tradeData.txHex,
        tokenAddress: tradeData.tokenAddress,
        timestamp: new Date().toISOString(),
    };
    try {
        const TradeModel = (0, trade_1.getTradeModel)(tradeData.tokenAddress);
        const newTrade = new TradeModel(tradeInput);
        await newTrade.save();
        if (tradeData.type === "buy") {
            checkRaydium = (0, web3_1.checkRaydiumMigration)(tradeData.tokenAddress, coinId.creator.wallet);
        }
        // const io = req.app.get("io");
        // io.emit("new_trade", newTrade);
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("new_trade", newTrade);
        res.status(200).json({
            message: "Trade recorded successfully",
            trade: newTrade,
            checkRaydium,
        });
    }
    catch (error) {
        console.error("Error saving trade:", error);
        res.status(500).json({
            error: "Failed to record trade",
            message: error.message,
        });
    }
});
// GET route to fetch trades for a specific token address
router.get("/api/trades/:tokenAddress", async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        const TradeModel = (0, trade_1.getTradeModel)(tokenAddress);
        const trades = await TradeModel.find();
        // if (trades.length === 0) {
        //   return res
        //     .status(404)
        //     .json({ message: `No trades found for token ${tokenAddress}` });
        // }
        res.status(200).json({ trades });
    }
    catch (error) {
        console.error("Error fetching trades:", error);
        res.status(500).json({
            error: "Failed to fetch trades",
            message: error.message,
        });
    }
});
exports.default = router;
