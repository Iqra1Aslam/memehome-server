"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const web3_1 = require("../../program/web3");
const router = (0, express_1.Router)();
// Raydium migration
router.post("/check-raydium", async (req, res) => {
    try {
        const { tokenAddress, creatorWallet } = req.body;
        if (!tokenAddress || !creatorWallet) {
            return res.status(400).json({
                error: "Missing required query parameters: tokenAddress and creatorWallet",
            });
        }
        const migrationResult = await (0, web3_1.checkRaydiumMigration)(tokenAddress, creatorWallet);
        res.status(200).json({
            message: "Migration check completed",
            migrationResult,
        });
    }
    catch (error) {
        console.error("Error checking Raydium migration:", error);
        res.status(500).json({
            error: "Failed to check migration",
            message: error.message,
        });
    }
});
// sol Price
router.get("/sol-price", async (req, res) => {
    const response = await fetch("https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD");
    const data = await response.json();
    res.json(data);
});
// Bonding curve progress
// router.post('/bonding-curve-progress', async (req, res) => {
//   try {
//     const { realTokenReserves, curveLimit } = req.body;
//     if (typeof realTokenReserves !== 'number' || typeof curveLimit !== 'number') {
//       return res.status(400).json({ error: 'realTokenReserves and curveLimit must be numbers.' });
//     }
//     const remainingPercentage = (realTokenReserves / curveLimit) * 100;
//     const distributedPercentage = 100 - remainingPercentage;
//     return res.status(200).json({
//       distributedPercentage: distributedPercentage,
//     });
//   } catch (error) {
//     console.error('Error calculating bonding curve progress:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });
// router.post("/bonding-curve-progress", async (req, res) => {
//   try {
//     const { realTokenReserves, curveLimit } = req.body;
//     if (
//       typeof realTokenReserves !== "number" ||
//       typeof curveLimit !== "number"
//     ) {
//       return res
//         .status(400)
//         .json({ error: "realTokenReserves and curveLimit must be numbers." });
//     }
//     const remainingPercentage = (realTokenReserves / curveLimit) * 100;
//     const distributedPercentage = 100 - remainingPercentage;
//     const io = req.app.get("io");
//     io.emit("coinProgress", { distributedPercentage });
//     return res.status(200).json({
//       distributedPercentage: distributedPercentage,
//     });
//   } catch (error) {
//     console.error("Error calculating bonding curve progress:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });
//ably
router.post('/bonding-curve-progress', async (req, res) => {
    try {
        const { realTokenReserves, curveLimit } = req.body;
        if (typeof realTokenReserves !== 'number' || typeof curveLimit !== 'number') {
            return res.status(400).json({ error: 'realTokenReserves and curveLimit must be numbers.' });
        }
        const remainingPercentage = (realTokenReserves / curveLimit) * 100;
        const distributedPercentage = 100 - remainingPercentage;
        // const io = req.app.get('io');
        //   io.emit("coinProgress", { distributedPercentage });
        const ably = req.app.get("ably");
        const channel = ably.channels.get("coins");
        channel.publish("progressGet", { distributedPercentage });
        return res.status(200).json({
            distributedPercentage: distributedPercentage,
        });
    }
    catch (error) {
        console.error('Error calculating bonding curve progress:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
