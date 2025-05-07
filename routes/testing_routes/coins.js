"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Coin_1 = __importDefault(require("../../models/Coin"));
const User_1 = __importDefault(require("../../models/User"));
const web3_1 = require("../../program/web3");
const router = (0, express_1.Router)();
// POST route to create a coin using ably
router.post("/create-coin", async (req, res) => {
    try {
        const { wallet, name, bondingCurve, ticker, description, token, url, imgUrl, } = req.body;
        const userId = await User_1.default.findOne({ wallet });
        if (userId) {
            const creator = userId._id;
            const newCoin = new Coin_1.default({
                creator,
                name,
                bondingCurve,
                ticker,
                description,
                token,
                url,
                imgUrl,
            });
            const savedCoin = await newCoin.save();
            const populatedCoin = await savedCoin.populate("creator");
            const marketCap = (await (0, web3_1.getMarketCapSolFromBondingC)(savedCoin.bondingCurve)) / 1000000;
            // const io = req.app.get('io');
            // io.emit("coinAdded", { ...populatedCoin.toObject(), marketCap });
            const ably = req.app.get("ably");
            const channel = ably.channels.get("coins");
            channel.publish("coinAdded", { ...populatedCoin.toObject(), marketCap });
            res.status(201).json(savedCoin);
        }
        else {
            res.status(404).json({ error: "User not found" });
        }
    }
    catch (error) {
        console.error("Error creating coin: ", error);
        res
            .status(500)
            .json({ msg: "Error creating coin", error: error.message });
    }
});
// GET route to fetch all coins
router.get("/getAllCoins", async (req, res) => {
    try {
        const getAllCoins = await Coin_1.default.find({
            bondingCurve: { $exists: true },
        }).populate("creator");
        const coinsWithMarketCap = await Promise.all(getAllCoins.map(async (coin) => {
            const marketCap = (await (0, web3_1.getMarketCapSolFromBondingC)(coin.bondingCurve)) / 1000000;
            return { ...coin.toObject(), marketCap };
        }));
        res.json(coinsWithMarketCap);
    }
    catch (error) {
        console.error("Error getting all coins:", error);
        res.status(500).json({
            error: `Error in getting all coins: ${error.message}`,
        });
    }
});
// GET route to fetch coin details by ID
router.get("/coinDetail/:tokenAddress", async (req, res) => {
    const { tokenAddress } = req.params;
    try {
        // const getacoin = await Coin.findById(id);
        const getacoin = await Coin_1.default.findOne({ token: tokenAddress }).populate("creator", "name -_id");
        if (!getacoin) {
            return res.status(404).json({ error: "Coin not found" });
        }
        const marketCap = (await (0, web3_1.getMarketCapSolFromBondingC)(getacoin.bondingCurve)) / 1000000;
        const bId = getacoin.bondingCurve;
        const bondingCProgress = await (0, web3_1.getBondingCurveProgressAMarketC)(bId);
        const coinDetailWMarketCap = {
            ...getacoin.toObject(),
            marketCap,
            bondingCProgress,
        };
        res.json(coinDetailWMarketCap);
    }
    catch (error) {
        console.error("Error fetching coin details:", error);
        res.status(500).json({ error: error.message });
    }
});
router.get("/api/token-creation-notifications", async (req, res) => {
    try {
        // Find the most recently created coin using proper sorting
        const coin = await Coin_1.default.findOne()
            .sort({ _id: -1 }) // Sort by MongoDB's native _id (always reliable)
            .populate("creator")
            .lean();
        if (!coin) {
            return res.status(404).json({
                notification: "No tokens created yet",
                fallback: true,
            });
        }
        // Handle cases where creator might not be populated
        const walletAddress = coin.creator?.wallet || "Unknown";
        const truncatedWallet = `${walletAddress.slice(0, 5)}...`;
        res.json({
            notification: `${truncatedWallet} created ${coin.name}`,
            coinId: coin._id,
        });
    }
    catch (error) {
        console.error("Error fetching latest token:", error);
        res.status(500).json({
            notification: "0xAbcde... created SampleToken", // Your fallback format
            fallback: true,
            error: error.message,
        });
    }
});
router.get('/getSimilarCoins/:tokenAddress', async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        // 1. Find the main coin by tokenAddress
        const mainCoin = await Coin_1.default.findOne({ token: tokenAddress });
        if (!mainCoin) {
            return res.status(404).json({ error: 'Coin not found' });
        }
        // 2. Find similar coins
        const similarCoins = await Coin_1.default.find({
            _id: { $ne: mainCoin._id }, // exclude this coin itself
            bondingCurve: { $exists: true },
            wallet: { $exists: false },
            $or: [
                { name: { $regex: mainCoin.name.split(' ')[0], $options: 'i' } },
                { ticker: { $regex: mainCoin.ticker.replace('$', ''), $options: 'i' } },
            ],
        })
            .select('-wallet');
        // .limit(10)
        // .populate('creator');
        // 3. Calculate marketCap
        const coinsWithMarketCap = await Promise.all(similarCoins.map(async (coin) => {
            const marketCap = (await (0, web3_1.getMarketCapSolFromBondingC)(coin.bondingCurve)) / 1000000;
            return { ...coin.toObject(), marketCap };
        }));
        res.json(coinsWithMarketCap);
    }
    catch (error) {
        console.error('Error getting similar coins:', error);
        res.status(500).json({
            error: `Error in getting similar coins: ${error.message}`,
        });
    }
});
exports.default = router;
