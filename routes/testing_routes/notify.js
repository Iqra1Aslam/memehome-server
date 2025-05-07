"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Router } = require("express");
// const TradeSuccess = require("../../models/Notify"); // Assuming you have a TradeSuccess model defined
const Notify_1 = __importDefault(require("../../models/Notify"));
const router = Router();
// POST route: Delete existing records (if any) and save the new one
router.post("/api/trade-success", async (req, res) => {
    try {
        // Check if the collection is empty
        const documentCount = await Notify_1.default.countDocuments();
        if (documentCount > 0) {
            // Only delete if there are existing records
            await Notify_1.default.deleteMany({});
        }
        // Save the new TradeSuccess record
        const successData = req.body;
        const tradeSuccess = new Notify_1.default(successData);
        await tradeSuccess.save();
        // Publish the new trade to Ably for real-time updates
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("tradeSuccess", { tradeSuccess });
        res.status(201).json({ message: "Trade success recorded", tradeSuccess });
    }
    catch (error) {
        console.error("Error saving trade success:", error);
        res.status(500).json({ error: "Failed to record trade success" });
    }
});
// GET route: Fetch the most recent TradeSuccess record
router.get("/api/trade-success", async (req, res) => {
    try {
        // Fetch the most recent record (should only be one due to POST logic)
        const tradeSuccesses = await Notify_1.default.find()
            .sort({ createdAt: -1 }) // Sort by createdAt descending (most recent first)
            .limit(1); // Limit to 1 record
        res.status(200).json({ tradeSuccesses });
    }
    catch (error) {
        console.error("Error fetching trade successes:", error);
        res.status(500).json({ error: "Failed to fetch trade successes" });
    }
});
exports.default = router;
