"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Coin_1 = __importDefault(require("../../models/Coin"));
const web3_1 = require("../../program/web3");
const web3_2 = require("../../program/web3");
const web3_3 = require("../../program/web3");
const router = (0, express_1.Router)();
router.get("/getkothCoins", async (req, res) => {
    try {
        const coins = await Coin_1.default.find();
        const update = await Promise.all(coins.map(async (coin) => {
            const marketCap = (await (0, web3_2.getMarketCapSolFromBondingC)(coin.bondingCurve)) / 1000000;
            const kothProgress = await (0, web3_1.KingOfTheHillProgress)(coin.bondingCurve);
            let isCrown = false;
            if (kothProgress >= 100) {
                isCrown = true;
            }
            await Coin_1.default.findByIdAndUpdate(coin._id, {
                kothprogress: kothProgress,
                isCrown: isCrown,
            });
            return {
                ...coin.toObject(),
                kothProgress: kothProgress,
                isCrown,
                marketCap,
            };
        }));
        const crownCoin = update.filter((token) => token.isCrown === true);
        res.json({ success: true, data: crownCoin });
    }
    catch (error) {
        console.error("error fetching and updating koth progress: ", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
//using ably
router.get("/getkoth/:token", async (req, res) => {
    const { token } = req.params;
    try {
        const koth = await (0, web3_1.KingOfTheHillProgress)(token);
        // const io = req.app.get('io');
        // io.emit("kothGet", { koth });
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("kothGet", { koth });
        res.status(200).json({ progress: koth });
    }
    catch (error) {
        console.error("Error calculating king of the hill progress:", error);
        res.status(500).json({ error: "Failed to calculate progress" });
    }
});
router.get("/getSol/:tokenn", async (req, res) => {
    const { tokenn } = req.params;
    try {
        const balance = await (0, web3_3.getSol)(tokenn);
        // const io = req.app.get('io');
        // io.emit("kothGet", { koth });
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("solGet", { balance });
        res.status(200).json({ progress: balance });
    }
    catch (error) {
        console.error("Error calculating king of the hill progress:", error);
        res.status(500).json({ error: "Failed to calculate progress" });
    }
});
exports.default = router;
