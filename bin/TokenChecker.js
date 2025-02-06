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
exports.TokenChecker = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const bs58_1 = __importDefault(require("bs58"));
const web3_js_1 = require("@solana/web3.js");
const Logger_1 = require("./Logger");
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const Utils_1 = require("./Utils");
class TokenChecker {
    /**
     * Fetches token balance for a given wallet address.
     * @param wallet - Wallet address to check.
     * @returns Token balance or "error" if request fails.
     */
    static async getBalance(publicKey) {
        const url = `${this.API_URL}?wallet=${publicKey.toBase58()}`;
        try {
            const response = await (0, Utils_1.sendRequest)(url, 10000);
            if (response.data.length === 0) {
                return 0;
            }
            else {
                const allocation = response.data[0];
                const claimed = allocation.claimed || 0;
                const vested = allocation.vested || 0;
                return vested - claimed;
            }
        }
        catch (error) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error getting balance for wallet ${publicKey}: ${error.message}`);
        }
    }
    /**
     * Processes wallets from the file and filters those eligible for token claiming.
     */
    static async filterByWalletBalance() {
        try {
            const wallets = GlobalConfig_1.default.getInstance().WALLETS;
            const minBalance = GlobalConfig_1.default.getInstance().MIN_TOKEN_AMOUNT ?? 0;
            let eligibleWallets = [];
            this.checkFile();
            for (let index = 0; index < wallets.length; index++) {
                let walletNumber = index + 1;
                let wallet = wallets[index];
                const walletKeyPair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(wallets[index]));
                const balance = await this.getBalance(walletKeyPair.publicKey);
                if (balance == 0) {
                    (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, (0, Logger_1.messageWithWallet)(walletNumber, 'Skipping wallet, it is not eligible / no token to claim.'));
                    continue;
                }
                if (balance >= minBalance) {
                    (0, Logger_1.logMessage)(Logger_1.LogLevel.SUCCESS, (0, Logger_1.messageWithWallet)(walletNumber, `Token amount: ${chalk_1.default.cyan(balance)} From wallet: ${chalk_1.default.underline(`${walletKeyPair.publicKey}`)}`));
                    eligibleWallets.push(wallets[index]);
                }
                else {
                    (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, (0, Logger_1.messageWithWallet)(walletNumber, `Skipping wallet, not enough tokens: ${chalk_1.default.cyan(balance)}`));
                }
            }
            fs.writeFileSync(TokenChecker.OUTPUT_FILE, eligibleWallets.join("\n"), "utf8");
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Wallets saved to: ${chalk_1.default.bgMagenta(TokenChecker.OUTPUT_FILE)}`);
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, chalk_1.default.green `Process completed successfully...`);
        }
        catch (error) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error processing wallets: ${error.message}`);
        }
    }
    static checkFile() {
        if (!fs.existsSync(path.dirname(TokenChecker.OUTPUT_FILE))) {
            fs.mkdirSync(path.dirname(TokenChecker.OUTPUT_FILE), { recursive: true });
        }
        else if (fs.statSync(TokenChecker.OUTPUT_FILE).size > 0) {
            fs.writeFileSync(TokenChecker.OUTPUT_FILE, "", "utf8");
        }
    }
}
exports.TokenChecker = TokenChecker;
TokenChecker.OUTPUT_FILE = "./data/checked_wallets.txt"; // Output file for checked wallets
TokenChecker.API_URL = "https://claim.nodefoundation.ai/api/allocations"; // API URL
//# sourceMappingURL=TokenChecker.js.map