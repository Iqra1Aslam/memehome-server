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
exports.ORACLE_SEED = exports.OPERATION_SEED = exports.TICK_ARRAY_SEED = exports.POOL_LPMINT_SEED = exports.POOL_AUTH_SEED = exports.POOL_VAULT_SEED = exports.POOL_SEED = exports.AMM_CONFIG_SEED = void 0;
exports.u16ToBytes = u16ToBytes;
exports.i16ToBytes = i16ToBytes;
exports.u32ToBytes = u32ToBytes;
exports.i32ToBytes = i32ToBytes;
exports.getAmmConfigAddress = getAmmConfigAddress;
exports.getAuthAddress = getAuthAddress;
exports.getPoolAddress = getPoolAddress;
exports.getPoolVaultAddress = getPoolVaultAddress;
exports.getPoolLpMintAddress = getPoolLpMintAddress;
exports.getOrcleAccountAddress = getOrcleAccountAddress;
const anchor = __importStar(require("@project-serum/anchor"));
const web3_js_1 = require("@solana/web3.js");
exports.AMM_CONFIG_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("amm_config"));
exports.POOL_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("pool"));
exports.POOL_VAULT_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("pool_vault"));
exports.POOL_AUTH_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("vault_and_lp_mint_auth_seed"));
exports.POOL_LPMINT_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("pool_lp_mint"));
exports.TICK_ARRAY_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("tick_array"));
exports.OPERATION_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("operation"));
exports.ORACLE_SEED = Buffer.from(anchor.utils.bytes.utf8.encode("observation"));
function u16ToBytes(num) {
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, num, false);
    return new Uint8Array(arr);
}
function i16ToBytes(num) {
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, num, false);
    return new Uint8Array(arr);
}
function u32ToBytes(num) {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, num, false);
    return new Uint8Array(arr);
}
function i32ToBytes(num) {
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, num, false);
    return new Uint8Array(arr);
}
async function getAmmConfigAddress(index, programId) {
    const [address, bump] = await web3_js_1.PublicKey.findProgramAddress([exports.AMM_CONFIG_SEED, u16ToBytes(index)], programId);
    return [address, bump];
}
async function getAuthAddress(programId) {
    const [address, bump] = await web3_js_1.PublicKey.findProgramAddress([exports.POOL_AUTH_SEED], programId);
    return [address, bump];
}
async function getPoolAddress(ammConfig, tokenMint0, tokenMint1, programId) {
    const [address, bump] = await web3_js_1.PublicKey.findProgramAddress([
        exports.POOL_SEED,
        ammConfig.toBuffer(),
        tokenMint0.toBuffer(),
        tokenMint1.toBuffer(),
    ], programId);
    return [address, bump];
}
async function getPoolVaultAddress(pool, vaultTokenMint, programId) {
    const [address, bump] = await web3_js_1.PublicKey.findProgramAddress([exports.POOL_VAULT_SEED, pool.toBuffer(), vaultTokenMint.toBuffer()], programId);
    return [address, bump];
}
async function getPoolLpMintAddress(pool, programId) {
    const [address, bump] = await web3_js_1.PublicKey.findProgramAddress([exports.POOL_LPMINT_SEED, pool.toBuffer()], programId);
    return [address, bump];
}
async function getOrcleAccountAddress(pool, programId) {
    const [address, bump] = await web3_js_1.PublicKey.findProgramAddress([exports.ORACLE_SEED, pool.toBuffer()], programId);
    return [address, bump];
}
