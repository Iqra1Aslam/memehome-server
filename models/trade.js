"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTradeModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the trade schema
const tradeSchema = new mongoose_1.Schema({
    account: { type: String, required: true },
    type: { type: String, enum: ["buy", "sell"], required: true },
    tokenAmount: { type: Number, required: true },
    solAmount: { type: Number, required: true },
    txHex: { type: String, required: true },
    tokenAddress: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
});
// Cache for dynamic models to avoid redefinition
const tradeModels = {};
// Function to get or create a model for a specific token address
const getTradeModel = (tokenAddress) => {
    // Sanitize tokenAddress to create a valid collection name
    const collectionName = `trades_${tokenAddress
        .replace(/[^a-zA-Z0-9]/g, "_")
        .slice(0, 50)}`;
    if (!tradeModels[collectionName]) {
        tradeModels[collectionName] = mongoose_1.default.model(collectionName, tradeSchema, collectionName // Explicitly set collection name
        );
    }
    return tradeModels[collectionName];
};
exports.getTradeModel = getTradeModel;
// Export the schema (optional, if needed elsewhere)
exports.default = tradeSchema;
