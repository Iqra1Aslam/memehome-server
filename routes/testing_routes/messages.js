"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Feedback_1 = __importDefault(require("../../models/Feedback"));
const User_1 = __importDefault(require("../../models/User"));
// import { getTradeModel } from "../models/trade";
const router = (0, express_1.Router)();
router.get("/getMessage/:tokenAddress", async (req, res) => {
    const { tokenAddress } = req.params;
    console.log("Fetching coin ID for tokenAddress:", tokenAddress);
    try {
        const messages = await Feedback_1.default.find({ tokenAddress }).populate("sender", "name");
        const formattedMessages = messages.map((msgObj) => ({
            message: msgObj.msg,
            time: msgObj.time,
            sender: {
                name: msgObj.sender?.name || "Unknown Sender",
            },
        }));
        return res.status(200).send(formattedMessages);
    }
    catch (err) {
        console.error(err);
        return res
            .status(400)
            .json({ error: "Failed to fetch messages", details: err.message });
    }
});
router.post("/message", async (req, res) => {
    const { msg, tokenAddress, walletAddress } = req.body;
    try {
        if (!msg)
            return res.status(400).json({ error: "Message is required" });
        if (!tokenAddress)
            return res.status(400).json({ error: "Token address is required" });
        if (!walletAddress)
            return res.status(400).json({ error: "Connect your wallet to post" });
        const senderDetails = await User_1.default.findOne({ wallet: walletAddress }).select("_id");
        if (!senderDetails) {
            return res.status(404).json({ error: "Sender details not found" });
        }
        const newMessage = new Feedback_1.default({
            msg,
            sender: senderDetails._id,
            tokenAddress,
        });
        const savedMessage = await newMessage.save();
        await savedMessage.populate("sender", "name");
        const formattedMessage = {
            message: savedMessage.msg,
            time: savedMessage.time,
            sender: {
                name: savedMessage.sender?.name,
            },
        };
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("coinAdded", { savedMessage: formattedMessage });
        console.log(formattedMessage);
        return res.status(200).json(savedMessage);
    }
    catch (err) {
        console.error("Error saving message:", err);
        return res
            .status(500)
            .json({ error: "Failed to save the message", details: err.message });
    }
});
router.get("/reply-count/:tokenAddress", async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const replyCount = await Feedback_1.default.countDocuments({ tokenAddress });
        const ably = req.app.get("ably");
        const channel = ably.channels.get(`reply-count-${tokenAddress}`);
        channel.publish("reply-count", { replyCount });
        // Send the count back in the response
        return res.status(200).json({ replyCount });
    }
    catch (error) {
        console.error("Error fetching reply count:", error);
        res.status(500).json({ error: "Failed to fetch reply count" });
    }
});
exports.default = router;
