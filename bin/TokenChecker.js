"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.multiCheckTokenBalances = multiCheckTokenBalances;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const Logger_1 = require("./Logger");
const Utils_1 = require("./Utils");
const Utils_2 = require("./Utils");
const chalk_1 = __importDefault(require("chalk"));
const config = GlobalConfig_1.default.getInstance();
const API_URL = "https://claim.nodefoundation.ai/api/allocations";

async function getBalance(publicKey) {
    const url = `${API_URL}?wallet=${publicKey.toBase58()}`;
    try {
        const response = await (0, Utils_2.sendRequest)(url, 20000);
        if (response.data.length === 0) {
            return 0;
        }
        const allocation = response.data[0];
        const claimed = allocation.claimed || 0;
        const vested = allocation.vested || 0;
        return vested - claimed;
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error getting balance for wallet ${chalk_1.default.underline(publicKey.toBase58())}: ${error.message}`);
        return -1;
    }
}

async function checkTokenBalanceForWallet(walletPrivateKey) {
    try {
        const walletKeyPair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(walletPrivateKey));
        const balance = await getBalance(walletKeyPair.publicKey);
        const minBalance = config.MIN_TOKEN_AMOUNT ?? 0;
        if (balance < 0) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error retrieving balance for wallet ${chalk_1.default.underline}${walletKeyPair.publicKey.toBase58()}`);
            return { wallet: walletPrivateKey, status: "Error", error: "Balance retrieval error" };
        }
        else if (balance === 0) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Skipping wallet: ${chalk_1.default.underline(walletKeyPair.publicKey)} – ${chalk_1.default.yellow("Not eligible")} / ${chalk_1.default.yellow("No tokens to claim")}`);
            return { wallet: walletPrivateKey, status: "Skipped", error: "Zero balance" };
        }
        else if (balance < minBalance) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Skipping wallet: ${chalk_1.default.underline(walletKeyPair.publicKey)} - Not enough: ${chalk_1.default.dim(balance.toString())}`);
            return { wallet: walletPrivateKey, status: "Skipped", error: "Not enough tokens" };
        }
        else {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Suitable wallet: ${chalk_1.default.underline(walletKeyPair.publicKey)} - Token amount: ${chalk_1.default.cyan(balance)}`);
            return { wallet: walletPrivateKey, status: "Success" };
        }
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error processing wallet: ${error.message}`);
        return { wallet: walletPrivateKey, status: "Error", error: error.message };
    }
}

async function multiCheckTokenBalances() {
    const wallets = config.WALLETS;
    const walletItems = wallets.map((wallet) => ({
        wallet,
    }));
    await (0, Utils_1.batchProcess)(walletItems, async (item) => checkTokenBalanceForWallet(item.wallet), config.THREADS, 2000, "checked_wallets");
    (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Wallets saved to: ${chalk_1.default.bgMagenta('./results/checked_wallets.txt')}`);
    (0, Logger_1.logMessage)(Logger_1.LogLevel.SUCCESS, chalk_1.default.green `Checking process completed, successfully!`);
}
