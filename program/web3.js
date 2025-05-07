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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eachTokenPrice = exports.KingOfTheHillProgress = exports.checkRaydiumMigration = exports.getSol = exports.getBondingCurveProgressAMarketC = exports.getMarketCapSolFromBondingC = void 0;
// Add these at the top of the file
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const anchor = __importStar(require("@project-serum/anchor"));
const idl = require("../idl.json");
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const anchor_1 = require("@project-serum/anchor");
const spl_token_1 = require("@solana/spl-token");
const constant_1 = require("../constant");
const utilFunc_1 = require("./utilFunc");
const BN = require("bn.js");
const pda_1 = require("./pda");
const config_1 = require("./config");
const token_1 = require("@project-serum/anchor/dist/cjs/utils/token");
const PROGRAM_ID = new web3_js_1.PublicKey(idl.metadata.address);
const NETWORK = anchor_1.web3.clusterApiUrl("devnet");
const opts = { preflightCommitment: "processed" };
// Load private key from environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY not found in environment variables");
}
const admin = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(PRIVATE_KEY));
console.log("admin: ", admin.publicKey.toBase58());
//setting connection and provider for program
const connection = new web3_js_1.Connection(NETWORK, opts.preflightCommitment);
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(admin), opts);
const program = new anchor.Program(idl, PROGRAM_ID, provider);
const [configPda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from(constant_1.SEED_CONFIG)], program.programId);
const getMarketCapSolFromBondingC = async (bID) => {
    const bondingCurveAcc = (await program.account.bondingCurve.fetch(`${bID}`));
    const tokenTotalSupply = bondingCurveAcc.tokenTotalSupply.toNumber();
    const virtualSolReserves = bondingCurveAcc.virtualSolReserves.toNumber();
    const virtualTokenReserves = bondingCurveAcc.virtualTokenReserves.toNumber();
    const marketCap = await (0, utilFunc_1.getMarketCap)(tokenTotalSupply, virtualSolReserves, virtualTokenReserves);
    return marketCap;
};
exports.getMarketCapSolFromBondingC = getMarketCapSolFromBondingC;
const getBondingCurveProgressAMarketC = async (bID) => {
    const bondingCurveAcc = (await program.account.bondingCurve.fetch(`${bID}`));
    const configAcc = (await program.account.config.fetch(configPda));
    const curveLimit = configAcc.curveLimit.toNumber() / 1000000;
    const realTokenReserves = bondingCurveAcc.realTokenReserves.toNumber() / 1000000;
    const bondingCurveProgress = await (0, utilFunc_1.getBondingCurveProgress)(realTokenReserves, curveLimit);
    return bondingCurveProgress;
};
exports.getBondingCurveProgressAMarketC = getBondingCurveProgressAMarketC;
//function removing liquidity
const RemoveLiquidity = async (tokenMint, creator) => {
    const wsol_mint = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
    console.log("token mint: ", tokenMint.toBase58());
    const [bondingCurvePda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), tokenMint.toBytes()], program.programId);
    console.log("bonding curve: ", bondingCurvePda.toBase58());
    const creatorAcc = creator;
    const opTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(tokenMint, admin.publicKey, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
    console.log("op token account: ", opTokenAccount.toBase58());
    const wrpaSolAccount = await anchor.utils.token.associatedAddress({
        mint: wsol_mint,
        owner: admin.publicKey,
    });
    console.log("wrap sol account: ", wrpaSolAccount.toBase58());
    const bondingCurveTokenAccount = await (0, spl_token_1.getAssociatedTokenAddress)(tokenMint, bondingCurvePda, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
    console.log("bonding curve token account: ", bondingCurveTokenAccount.toBase58());
    console.log("associated token program id: ", spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
    const tx = await program.methods
        .removeLiquidity()
        .accounts({
        payer: admin.publicKey,
        bondingCurve: bondingCurvePda,
        curveTokenAccount: bondingCurveTokenAccount,
        tokenMint,
        creatorAccount: creatorAcc,
        opTokenAccount: opTokenAccount,
        wrapSolAccount: wrpaSolAccount,
        wsolMint: wsol_mint,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
        associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
    })
        .signers([admin])
        .rpc();
    console.log("tx remove liquidity: ", tx);
    let transaction = new web3_js_1.Transaction();
    let syncNativeTx = (0, spl_token_1.createSyncNativeInstruction)(wrpaSolAccount, spl_token_1.TOKEN_PROGRAM_ID);
    transaction.add(syncNativeTx);
    const txSyncSig = await (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [
        admin,
    ]);
    console.log("syncnative transacion: ", txSyncSig);
    return { tx, txSyncSig };
};
const getSol = async (BID) => {
    try {
        const bondingCurveBalance = await connection.getBalance(new web3_js_1.PublicKey(`${BID}`));
        const Sol = bondingCurveBalance / 1_000_000_000;
        return Sol;
    }
    catch (error) {
        console.error("Error calculating king of the hill progress", error);
        return 0;
    }
};
exports.getSol = getSol;
//function for proxy initialize for creating liquidity pool on raydium
const ProxyInitialize = async (token1Mint) => {
    const token0Mint = new web3_js_1.PublicKey("So11111111111111111111111111111111111111112");
    const [auth] = await (0, pda_1.getAuthAddress)(config_1.cpSwapProgram);
    console.log(" auth: ", auth.toBase58());
    const [poolAddress] = await (0, pda_1.getPoolAddress)(config_1.configAddress, token0Mint, token1Mint, config_1.cpSwapProgram);
    console.log("pool address: ", poolAddress.toBase58());
    const [lpMintAddress] = await (0, pda_1.getPoolLpMintAddress)(poolAddress, config_1.cpSwapProgram);
    console.log(" lpMintaddress: ", lpMintAddress.toBase58());
    const [vault0] = await (0, pda_1.getPoolVaultAddress)(poolAddress, token0Mint, config_1.cpSwapProgram);
    console.log(" vault 0: ", vault0.toBase58());
    const [vault1] = await (0, pda_1.getPoolVaultAddress)(poolAddress, token1Mint, config_1.cpSwapProgram);
    console.log(" vault1: ", vault1.toBase58());
    const [creatorLpTokenAddress] = await web3_js_1.PublicKey.findProgramAddress([
        admin.publicKey.toBuffer(),
        spl_token_1.TOKEN_PROGRAM_ID.toBuffer(),
        lpMintAddress.toBuffer(),
    ], token_1.ASSOCIATED_PROGRAM_ID);
    console.log(" creatorLpTokenAddress: ", creatorLpTokenAddress.toBase58());
    const [observationAddress] = await (0, pda_1.getOrcleAccountAddress)(poolAddress, config_1.cpSwapProgram);
    console.log("observation Address:  ", observationAddress.toBase58());
    const creatorToken1 = await (0, spl_token_1.getAssociatedTokenAddress)(token1Mint, admin.publicKey, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
    console.log("createToken0: ", creatorToken1.toBase58());
    const creatoreToken1Balance = await connection.getTokenAccountBalance(creatorToken1);
    const creator1Balance = creatoreToken1Balance.value.amount;
    console.log("creator 1 balance: ", creatoreToken1Balance.value.amount);
    const creatorToken0 = (0, spl_token_1.getAssociatedTokenAddressSync)(token0Mint, admin.publicKey, false, spl_token_1.TOKEN_PROGRAM_ID);
    console.log(" creatorToken1: ", creatorToken0.toBase58());
    const creatoreToken0Balance = await connection.getTokenAccountBalance(creatorToken0);
    const creator0Balance = creatoreToken0Balance.value.amount;
    console.log("creator 0 balance: ", creatoreToken0Balance.value.amount);
    const tx = await program.methods
        .proxyInitialize(new BN(creator0Balance), new BN(creator1Balance), new BN(0))
        .accounts({
        cpSwapProgram: config_1.cpSwapProgram,
        creator: admin.publicKey,
        ammConfig: config_1.configAddress,
        authority: auth,
        poolState: poolAddress,
        token0Mint: token0Mint,
        token1Mint: token1Mint,
        lpMint: lpMintAddress,
        creatorToken0: creatorToken0,
        creatorToken1: creatorToken1,
        creatorLpToken: creatorLpTokenAddress,
        token0Vault: vault0,
        token1Vault: vault1,
        createPoolFee: config_1.createPoolFeeReceive,
        observationState: observationAddress,
        tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        token0Program: spl_token_1.TOKEN_PROGRAM_ID,
        token1Program: spl_token_1.TOKEN_PROGRAM_ID,
        associatedTokenProgram: token_1.ASSOCIATED_PROGRAM_ID,
        systemProgram: web3_js_1.SystemProgram.programId,
        rent: web3_js_1.SYSVAR_RENT_PUBKEY,
    })
        .preInstructions([
        web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 }),
    ])
        .signers([admin])
        .rpc();
    console.log("tx: ", tx);
    return tx;
};
//final raydium migration function
const checkRaydiumMigration = async (token, creator) => {
    const tokenMint = new web3_js_1.PublicKey(`${token}`);
    const creatorA = new web3_js_1.PublicKey(`${creator}`);
    const [bondingCurvePda] = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), tokenMint.toBytes()], program.programId);
    console.log("bonding curve: ", bondingCurvePda.toBase58());
    const curveAccount = (await program.account.bondingCurve.fetch(bondingCurvePda));
    console.log("bonding curve account info: ", curveAccount);
    if (curveAccount.isCompleted === true) {
        const txRemoveL = await RemoveLiquidity(tokenMint, creatorA);
        if (txRemoveL.tx && txRemoveL.txSyncSig) {
            console.log("remove liquidity done successfully");
            const txProxyInitialize = await ProxyInitialize(tokenMint);
            if (txProxyInitialize) {
                console.log("token migrated to raydium");
            }
        }
        return "bonding curve completed and token migrated to raydium";
    }
    else {
        console.error("bonding curve is not complete");
        return "bonding curve is not complete";
    }
};
exports.checkRaydiumMigration = checkRaydiumMigration;
//function for calculating king of the hill progress
const KingOfTheHillProgress = async (BID) => {
    try {
        const bondingCurveBalance = await connection.getBalance(new web3_js_1.PublicKey(`${BID}`));
        const bondingCurveAcc = (await program.account.bondingCurve.fetch(`${BID}`));
        if (!bondingCurveAcc.isCompleted) {
            const kothProgress = (bondingCurveBalance / 1_000_000_000 / 20) * 100;
            return kothProgress;
        }
        else {
            // When bonding is completed, return 100% progress
            return 100;
        }
    }
    catch (error) {
        console.error("Error calculating king of the hill progress", error);
        return 0;
    }
};
exports.KingOfTheHillProgress = KingOfTheHillProgress;
const eachTokenPrice = async (bID) => {
    const bondingCurveAcc = (await program.account.bondingCurve.fetch(`${bID}`));
    const virtual_Sol = bondingCurveAcc.virtualSolReserves.toNumber() / 1_000_000;
    const virtual_token = bondingCurveAcc.virtualTokenReserves.toNumber() / 1_000_000;
    console.log("virtual sol", virtual_Sol);
    console.log("virtual token", virtual_token);
    const price = virtual_Sol / virtual_token;
    console.log(price);
    return price;
};
exports.eachTokenPrice = eachTokenPrice;
