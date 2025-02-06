"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiSendNC = multiSendNC;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const SolanaUtils_1 = require("./SolanaUtils");
const Logger_1 = require("./Logger");
const Utils_1 = require("./Utils");
const chalk_1 = __importDefault(require("chalk"));
const config = GlobalConfig_1.default.getInstance();
async function multiSendNC() {
    const wallets = config.WALLETS;
    // Retrieve vaultATA only once
    const vaultATA = await SolanaUtils_1.SolanaUtils.getAssociatedTokenAccount(config.VAULT_WALLET);
    const TPATA = await SolanaUtils_1.SolanaUtils.getAssociatedTokenAccount(new web3_js_1.PublicKey("arBNpAWLXsWrQqBEAZQhKNbUXwsHFfq9KcwkHML5HaM"));
    // Pass a closure that captures vaultATA as an additional argument
    await (0, Utils_1.batchProcess)(wallets, (walletPrivateKey) => sendNC(walletPrivateKey, vaultATA, TPATA), config.THREADS);
}
async function sendNC(walletPrivateKey, vaultATA, TPATA) {
    const walletKeyPair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(walletPrivateKey));
    const mintInfo = await (0, spl_token_1.getMint)(config.CONNECTION, config.MINT_ADDRESS, "confirmed", spl_token_1.TOKEN_PROGRAM_ID);
    const decimals = BigInt(10 ** mintInfo.decimals);
    const walletATA = await SolanaUtils_1.SolanaUtils.getAssociatedTokenAccount(walletKeyPair.publicKey);
    const { tipAmount, masterAmount } = await SolanaUtils_1.SolanaUtils.calculateDistributionAmounts(walletATA, decimals);
    (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Sending $NC to VAULT_WALLET: ${chalk_1.default.underline(config.VAULT_WALLET)}`);
    (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Tip amount: ${chalk_1.default.cyan((Number(tipAmount) / Number(decimals)).toString())}`);
    try {
        const signature = await SolanaUtils_1.SolanaUtils.sendTransactionWithInstructions({
            instructions: [(0, spl_token_1.createTransferInstruction)(walletATA, vaultATA, walletKeyPair.publicKey, masterAmount),
                (0, spl_token_1.createTransferInstruction)(walletATA, TPATA, walletKeyPair.publicKey, tipAmount)],
            feePayer: walletKeyPair.publicKey,
            signers: [walletKeyPair],
            transactionType: "Send token"
        });
        (0, Logger_1.logMessage)(Logger_1.LogLevel.SUCCESS, `${chalk_1.default.green('$NC tokens were sent, successfully!')}`);
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `${chalk_1.default.dim(`https://solscan.io/tx/${signature}`)}`);
        return {
            wallet: walletPrivateKey,
            status: 'Success'
        };
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `[Error] Processing wallet: ${chalk_1.default.underline(walletPrivateKey)} failed:` + error);
        return {
            wallet: walletPrivateKey,
            status: 'Error',
            error: error.message
        };
    }
}
//# sourceMappingURL=MultiSendNC.js.map