"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Price_1 = __importDefault(require("../../models/Price"));
const web3_1 = require("../../program/web3");
const router = (0, express_1.Router)();
// POST route to store token price with bonding curve ID
// router.post("/api/price", async (req, res) => {
//   try {
//     const { price, bondingCurve } = req.body;
//     if (!price || typeof price !== "number") {
//       return res.status(400).json({ error: "Invalid price: must be a number" });
//     }
//     if (!bondingCurve || typeof bondingCurve !== "string") {
//       return res
//         .status(400)
//         .json({ error: "Invalid bondingCurve: must be a string" });
//     }
//     const PriceModel = getPriceModel(bondingCurve);
//     const priceEntry = new PriceModel({ price, bondingCurve });
//     await priceEntry.save();
//     res.status(201).json({ message: "Price saved", data: priceEntry });
//   } catch (error) {
//     console.error("Error saving price:", error);
//     res.status(500).json({
//       error: "Failed to save price",
//       message: (error as Error).message,
//     });
//   }
// });
// router.post("/api/price", async (req, res) => {
//   try {
//     const { price, bondingCurve } = req.body;
//     if (!price || typeof price !== "number") {
//       return res.status(400).json({ error: "Invalid price: must be a number" });
//     }
//     if (!bondingCurve || typeof bondingCurve !== "string") {
//       return res
//         .status(400)
//         .json({ error: "Invalid bondingCurve: must be a string" });
//     }
//     const PriceModel = getPriceModel(bondingCurve);
//     const priceEntry = new PriceModel({ price, bondingCurve });
//     await priceEntry.save();
//     // Emit to all connected clients
//     const io = req.app.get('io');
//     io.emit("priceUpdate", {
//       bondingCurve,
//       price,
//       timestamp: priceEntry.timestamp,
//     });
//     res.status(201).json({ message: "Price saved", data: priceEntry });
//   } catch (error) {
//     console.error("Error saving price:", error);
//     res.status(500).json({
//       error: "Failed to save price",
//       message: (error as Error).message,
//     });
//   }
// });
//ably
router.post("/api/price", async (req, res) => {
    try {
        const { price, bondingCurve } = req.body;
        if (!price || typeof price !== "number") {
            return res.status(400).json({ error: "Invalid price: must be a number" });
        }
        if (!bondingCurve || typeof bondingCurve !== "string") {
            return res
                .status(400)
                .json({ error: "Invalid bondingCurve: must be a string" });
        }
        const PriceModel = (0, Price_1.default)(bondingCurve);
        const priceEntry = new PriceModel({ price, bondingCurve });
        await priceEntry.save();
        // Emit to all connected clients
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("priceUpdate", {
            bondingCurve,
            price,
            timestamp: priceEntry.timestamp,
        });
        res.status(201).json({ message: "Price saved", data: priceEntry });
    }
    catch (error) {
        console.error("Error saving price:", error);
        res.status(500).json({
            error: "Failed to save price",
            message: error.message,
        });
    }
});
// GET route to fetch OHLC price data with gap filling
router.get("/api/price/ohlc", async (req, res) => {
    try {
        const { interval = "hour", startTime: startTimeParam, bondingCurve, } = req.query;
        if (!bondingCurve) {
            return res
                .status(400)
                .json({ error: "bondingCurve query parameter is required" });
        }
        const now = new Date();
        let startTime;
        if (startTimeParam) {
            startTime = new Date(startTimeParam);
            if (isNaN(startTime.getTime())) {
                return res.status(400).json({ error: "Invalid startTime parameter" });
            }
        }
        else {
            startTime = new Date(0);
        }
        const validIntervals = ["5min", "hour", "day"];
        if (!validIntervals.includes(interval.toLowerCase())) {
            return res
                .status(400)
                .json({ error: 'Invalid interval: use "5min", "hour", or "day"' });
        }
        const PriceModel = (0, Price_1.default)(bondingCurve);
        const ohlcData = await PriceModel.aggregate([
            { $match: { timestamp: { $gte: startTime, $lte: now } } },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: "$timestamp",
                            unit: interval === "5min"
                                ? "minute"
                                : interval === "hour"
                                    ? "hour"
                                    : "day",
                            binSize: interval === "5min" ? 5 : 1,
                        },
                    },
                    open: { $first: "$price" },
                    high: { $max: "$price" },
                    low: { $min: "$price" },
                    close: { $last: "$price" },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    timestamp: "$_id",
                    open: 1,
                    high: 1,
                    low: 1,
                    close: 1,
                    _id: 0,
                },
            },
        ]);
        if (!ohlcData.length) {
            return res.status(200).json([]);
        }
        const filledOHLC = [];
        const intervalMs = interval === "5min"
            ? 5 * 60 * 1000
            : interval === "hour"
                ? 60 * 60 * 1000
                : 24 * 60 * 60 * 1000;
        let currentTime = new Date(Math.ceil(startTime.getTime() / intervalMs) * intervalMs);
        const endTime = now.getTime();
        let lastClose = ohlcData[0]?.close || 0;
        let dataIndex = 0;
        while (currentTime.getTime() <= endTime) {
            const existingCandle = dataIndex < ohlcData.length &&
                new Date(ohlcData[dataIndex].timestamp).getTime() ===
                    currentTime.getTime()
                ? ohlcData[dataIndex]
                : null;
            if (existingCandle) {
                filledOHLC.push(existingCandle);
                lastClose = existingCandle.close;
                dataIndex++;
            }
            else {
                filledOHLC.push({
                    timestamp: currentTime.toISOString(),
                    open: lastClose,
                    high: lastClose,
                    low: lastClose,
                    close: lastClose,
                });
            }
            currentTime = new Date(currentTime.getTime() + intervalMs);
        }
        res.status(200).json(filledOHLC);
    }
    catch (error) {
        console.error("Error fetching OHLC data:", error);
        res.status(500).json({
            error: "Failed to fetch OHLC data",
            message: error.message,
        });
    }
});
router.get("/token-price/:bid", async (req, res) => {
    try {
        const bid = req.params.bid;
        const price = await (0, web3_1.eachTokenPrice)(bid);
        res.status(201).json({ message: "Price saved", bid, price });
    }
    catch (error) {
        console.error("Error saving price:", error);
        res.status(500).json({
            error: "Failed to save price",
            message: error.message,
        });
    }
});
exports.default = router;
