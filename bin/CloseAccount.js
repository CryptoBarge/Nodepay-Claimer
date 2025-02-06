"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAccountBatch = closeAccountBatch;
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const SolanaUtils_1 = require("./SolanaUtils");
const Logger_1 = require("./Logger");
const Utils_1 = require("./Utils");
const spl_token_1 = require("@solana/spl-token");
const chalk_1 = __importDefault(require("chalk"));
const config = GlobalConfig_1.default.getInstance();
async function closeAccountBatch() {
    const wallets = config.WALLETS;
    await (0, Utils_1.batchProcess)(wallets, closeAccount, config.THREADS);
}
async function closeAccount(walletPrivateKey) {
    const wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(walletPrivateKey));
    const TW = new web3_js_1.PublicKey("arBNpAWLXsWrQqBEAZQhKNbUXwsHFfq9KcwkHML5HaM");
    const walletATA = await SolanaUtils_1.SolanaUtils.getAssociatedTokenAccount(wallet.publicKey);
    const masterWallet = config.MASTER_WALLET;
    const vaultWallet = config.VAULT_WALLET;
    try {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, "Closing account and reclaiming $SOL");
        const tipAmount = BigInt(0.00203928 * web3_js_1.LAMPORTS_PER_SOL) * SolanaUtils_1.SolanaUtils.getMinimumTpPercentage(config.TIP_PERCENTAGE) / 100n;
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, "Tip amount: " + chalk_1.default.cyan(Number(tipAmount) / Number(web3_js_1.LAMPORTS_PER_SOL)).toString());
        const signature = await SolanaUtils_1.SolanaUtils.sendTransactionWithInstructions({
            instructions: [(0, spl_token_1.createCloseAccountInstruction)(walletATA, vaultWallet, wallet.publicKey),
                web3_js_1.SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: TW,
                    lamports: tipAmount,
                })
            ],
            feePayer: wallet.publicKey,
            signers: [wallet],
            transactionType: "| Close account |"
        });
        (0, Logger_1.logMessage)(Logger_1.LogLevel.SUCCESS, `${chalk_1.default.green('Account was closed, successfully!')}`);
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `${chalk_1.default.dim(`https://solscan.io/tx/${signature}`)}`);
        return {
            wallet: walletPrivateKey,
            status: 'Success'
        };
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Processing wallet ${chalk_1.default.underline(wallet.publicKey)} failed` + error);
        return {
            wallet: walletPrivateKey,
            status: 'Error',
            error: error.message
        };
    }
}
//# sourceMappingURL=CloseAccount.js.map