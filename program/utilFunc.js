"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBondingCurveProgress = exports.getMarketCap = void 0;
const getMarketCap = async (tokenTotalSupply, virtualSolReserves, virtualTokenReserves) => {
    if (virtualTokenReserves === 0) {
        return 0;
    }
    return Math.floor((tokenTotalSupply * virtualSolReserves) / virtualTokenReserves);
};
exports.getMarketCap = getMarketCap;
//calculate bonding curve progress
const getBondingCurveProgress = async (realTokenReserves, totalSupply) => {
    if (realTokenReserves === 0) {
        return 100;
    }
    const remaniningpercentage = (realTokenReserves / totalSupply) * 100;
    const distributedpercentage = 100 - remaniningpercentage;
    return distributedpercentage;
};
exports.getBondingCurveProgress = getBondingCurveProgress;
