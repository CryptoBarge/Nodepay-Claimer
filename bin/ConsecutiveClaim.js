"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consecutiveClaim = consecutiveClaim;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const bs58_1 = __importDefault(require("bs58"));
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const SolanaUtils_1 = require("./SolanaUtils");
const ClaimToken_1 = require("./ClaimToken");
const Logger_1 = require("./Logger");
const chalk_1 = __importDefault(require("chalk"));
const globalConfig = GlobalConfig_1.default.getInstance();
async function consecutiveClaim() {
    const mintInfo = await (0, spl_token_1.getMint)(globalConfig.CONNECTION, globalConfig.MINT_ADDRESS, "confirmed", spl_token_1.TOKEN_PROGRAM_ID);
    const decimals = BigInt(10 ** mintInfo.decimals);
    const vaultATA = (await SolanaUtils_1.SolanaUtils.getOrCreateTokenAcount(globalConfig.VAULT_WALLET, web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(globalConfig.WALLETS[0])))).address;
    const TW = await SolanaUtils_1.SolanaUtils.getAssociatedTokenAccount(new web3_js_1.PublicKey("arBNpAWLXsWrQqBEAZQhKNbUXwsHFfq9KcwkHML5HaM"));
    for (let index = 0; index < globalConfig.WALLETS.length; index++) {
        let walletNumber = index + 1;
        if (index + 1 >= globalConfig.WALLETS.length) {
            break;
        }
        const wallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(globalConfig.WALLETS[index]));
        const nextWallet = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(globalConfig.WALLETS[index + 1]));
        try {
            await (0, ClaimToken_1.claimNode)((globalConfig.WALLETS[index]), walletNumber);
            const walletATA = await SolanaUtils_1.SolanaUtils.getAssociatedTokenAccount(wallet.publicKey);
            const { tipAmount, masterAmount } = await SolanaUtils_1.SolanaUtils.calculateDistributionAmounts(walletATA, decimals);
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Tip amount: ${chalk_1.default.cyan((Number(tipAmount) / Number(decimals)).toString())}`);
            const signature = await SolanaUtils_1.SolanaUtils.sendTransactionWithInstructions({
                instructions: [
                    (0, spl_token_1.createTransferInstruction)(walletATA, vaultATA, wallet.publicKey, masterAmount),
                    (0, spl_token_1.createTransferInstruction)(walletATA, TW, wallet.publicKey, tipAmount),
                    (0, spl_token_1.createCloseAccountInstruction)(walletATA, nextWallet.publicKey, wallet.publicKey)
                ],
                feePayer: wallet.publicKey,
                signers: [wallet],
                transactionType: "| Token transfer |"
            });
            await SolanaUtils_1.SolanaUtils.transferAllSol(wallet, nextWallet.publicKey, wallet.publicKey, "| Sending solana |");
            (0, Logger_1.logMessage)(Logger_1.LogLevel.SUCCESS, (0, Logger_1.messageWithWallet)(walletNumber, `${chalk_1.default.green('Claiming process completed, successfully!')}`));
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `${chalk_1.default.dim(`https://solscan.io/tx/${signature}`)}`);
        }
        catch (error) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, (0, Logger_1.messageWithWallet)(walletNumber, `Wallet: ${chalk_1.default.underline(wallet.publicKey)} failed. ` + error));
            break;
        }
    }
}
