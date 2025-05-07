"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const web3_js_1 = require("@solana/web3.js");
const User_1 = __importDefault(require("../models/User"));
const cors_1 = __importDefault(require("cors"));
const { verifySignature, getUtf8Encoder, getBase58Decoder } = require("@solana/kit");
const router = express_1.default.Router();
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://www.memehome.io",
];
router.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// Connect wallet
router.post("/connect-wallet", async (req, res) => {
    try {
        const { name, wallet } = req.body;
        let isExistingUser = await User_1.default.findOne({ wallet });
        if (!isExistingUser) {
            if (!name) {
                const aname = wallet;
                const user = await User_1.default.create({
                    name: `@${aname}`,
                    wallet,
                });
                res.json({ success: true, user });
            }
            else {
                const user = await User_1.default.create({
                    name,
                    wallet,
                });
                res.json({ success: true, user });
            }
        }
        else {
            res.json({ success: true, user: isExistingUser });
        }
    }
    catch (error) {
        console.error("Error in wallet connect:", error);
        res.status(500).json({
            success: false,
            msg: "Wallet connect failed",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// // Get holders for a token
// router.get("/coin/api/holders/:tokenAddress", async (req, res) => {
//   try {
//     const { tokenAddress } = req.params;
//     const connection = new Connection(
//       "https://api.devnet.solana.com",
//       "confirmed"
//     );
//     const tokenMintPublicKey = new PublicKey(tokenAddress);
//     // Get all token accounts for this mint
//     const tokenAccounts = await connection.getParsedProgramAccounts(
//       new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
//       {
//         filters: [
//           { dataSize: 165 }, // size of token account
//           { memcmp: { offset: 0, bytes: tokenMintPublicKey.toBase58() } }, // match mint address
//         ],
//       }
//     );
//     // Extract valid holder info
//     const holderData = tokenAccounts
//       .map((account) => {
//         const data = account.account.data;
//         if ("parsed" in data) {
//           const parsedData = data as ParsedAccountData;
//           const info = parsedData.parsed.info;
//           if (info && info.owner && info.tokenAmount.uiAmount > 0) {
//             return {
//               owner: info.owner,
//               balance: info.tokenAmount.uiAmount,
//             };
//           }
//         }
//         return null;
//       })
//       .filter(
//         (holder): holder is { owner: string; balance: number } =>
//           holder !== null
//       );
//     const totalSupply = holderData.reduce(
//       (sum, holder) => sum + holder.balance,
//       0
//     );
//     if (totalSupply === 0) {
//       return res.status(200).json({ message: "No wallet holders found." });
//     }
//     const formattedHolders = holderData
//       .map((holder) => ({
//         address: `${holder.owner.slice(0, 4)}...${holder.owner.slice(-4)}`,
//         fullAddress: holder.owner,
//         percentage: ((holder.balance / totalSupply) * 100).toFixed(2) + "%",
//       }))
//       .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
//       .slice(0, 5); // return top 5 holders
//     const ably = req.app.get("ably");
//     const channel = ably.channels.get("coins");
//     channel.publish("tokenHolders", { formattedHolders });
//     res.status(200).json(formattedHolders);
//   } catch (error) {
//     console.error("Error fetching holders:", error);
//     res
//       .status(500)
//       .json({ error: "Failed to fetch holders", details: error.message });
//   }
// });
router.get("/coin/api/holders/:tokenAddress", async (req, res) => {
    try {
        const { tokenAddress } = req.params;
        const connection = new web3_js_1.Connection("https://api.devnet.solana.com", "confirmed");
        const tokenMintPublicKey = new web3_js_1.PublicKey(tokenAddress);
        // Define the System Program public key
        const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
        // Fetch token accounts
        const tokenAccounts = await connection.getParsedProgramAccounts(new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), {
            filters: [
                { dataSize: 165 }, // Token account data size
                { memcmp: { offset: 0, bytes: tokenMintPublicKey.toBase58() } }, // Match token mint address
            ],
        });
        const AUTH_ADDRESS = "7rQ1QFNosMkUCuh7Z7fPbTHvh73b68sQYdirycEzJVuw";
        // Parse holder data
        const holderData = tokenAccounts
            .map((account) => {
            const data = account.account.data;
            if ("parsed" in data) {
                const parsedData = data;
                if (parsedData.parsed &&
                    parsedData.parsed.info &&
                    parsedData.parsed.info.owner &&
                    parsedData.parsed.info.tokenAmount.uiAmount > 0) {
                    return {
                        owner: parsedData.parsed.info.owner,
                        balance: parsedData.parsed.info.tokenAmount.uiAmount,
                    };
                }
            }
            return null;
        })
            .filter((holder) => holder !== null &&
            holder.balance > 0 &&
            holder.owner.startsWith(SYSTEM_PROGRAM_ID) === false && // Exclude system-owned accounts
            holder.owner !== AUTH_ADDRESS);
        // Calculate total supply
        const totalSupply = holderData.reduce((sum, holder) => sum + holder.balance, 0);
        // Handle case where totalSupply is 0
        if (totalSupply === 0) {
            return res.status(200).json({ message: "No wallet holders found." });
        }
        // Format holders
        const formattedHolders = holderData
            .map((holder) => ({
            address: `${holder.owner.substring(0, 4)}...${holder.owner.substring(holder.owner.length - 4)}`,
            fullAddress: holder.owner,
            percentage: ((holder.balance / totalSupply) * 100).toFixed(2) + "%",
        }))
            .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
        res.status(200).json(formattedHolders);
    }
    catch (error) {
        console.error("Error fetching holders:", error);
        res.status(500).json({ error: "Failed to fetch holders" });
    }
});
router.post("/signin-wallet", async (req, res) => {
    try {
        const { wallet, message, signature } = req.body;
        if (!wallet || !message || !signature) {
            return res.status(400).json({ success: false, msg: "Missing wallet, message, or signature" });
        }
        // Prepare for verification
        const messageBytes = getUtf8Encoder().encode(message);
        const signatureBytes = getBase58Decoder().decode(signature);
        const isValid = await verifySignature(wallet, signatureBytes, messageBytes);
        if (!isValid) {
            return res.status(401).json({ success: false, msg: "Invalid signature" });
        }
        const user = await User_1.default.findOne({ wallet });
        if (!user) {
            return res.status(404).json({ success: false, msg: "User not found. Connect wallet first." });
        }
        await User_1.default.updateOne({ wallet }, { $set: { lastSignedIn: new Date() } }, { upsert: true });
        return res.json({ success: true, msg: "Sign-in successful", user });
    }
    catch (error) {
        console.error("Sign-in failed:", error);
        res.status(500).json({ success: false, msg: "Server error", error: error.message });
    }
});
exports.default = router;
