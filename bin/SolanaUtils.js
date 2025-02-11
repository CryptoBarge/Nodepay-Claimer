"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaUtils = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const GlobalConfig_1 = __importDefault(require("./GlobalConfig"));
const Logger_1 = require("./Logger");
const chalk_1 = __importDefault(require("chalk"));
class SolanaUtils {

    static async transferAllSol(fromKeypair, toPublicKey, feePayer, transactionType) {
        const globalConfig = GlobalConfig_1.default.getInstance();
        const connection = globalConfig.CONNECTION;
        const instructionsCallback = async () => {
            const fromBalance = await connection.getBalance(fromKeypair.publicKey);
            if (fromBalance === 0) {
                throw new Error("No $SOL balance to transfer.");
            }
            const transferAmount = await this.getSolanaRemainingBalance(fromBalance, connection, fromKeypair.publicKey, toPublicKey, feePayer);
            if (transferAmount <= 0) {
                throw new Error("Not enough balance to cover the transaction fee.");
            }
            const instruction = web3_js_1.SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toPublicKey,
                lamports: transferAmount,
            });
            return [instruction];
        };

        const signature = await this.sendTransactionWithInstructions({
            instructionsCallback,
            feePayer: fromKeypair.publicKey,
            signers: [fromKeypair],
            transactionType,
            maxRetries: 10,
        });
        return signature;
    }

    static async calculateDistributionAmounts(walletATA, decimals) {
        let attempt = 0;
        const maxAttempts = 10;
        while (attempt < maxAttempts) {
            try {
                const globalConfig = GlobalConfig_1.default.getInstance();
                const walletAtaInfo = await (0, spl_token_1.getAccount)(globalConfig.CONNECTION, walletATA);
                const tokenAmount = walletAtaInfo.amount;
                (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Token amount to transfer: ${chalk_1.default.cyan(Number(tokenAmount) / Number(decimals))}`);

                let tipPercentage = this.getMinimumTpPercentage(globalConfig.TIP_PERCENTAGE);
                if (tokenAmount === 0n) {
                    throw new Error("Token amount is zero. No distribution needed.");
                }

                const tipAmount = (tokenAmount * tipPercentage) / 100n;
                const masterAmount = tokenAmount - tipAmount;
                return { tipAmount, masterAmount };
            }
            catch (error) {
                attempt++;
                (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Calculated failed after attempts: [${attempt}/${maxAttempts}] ${error.message}`);
                if (attempt >= maxAttempts) {
                    throw new Error(`Calculated failed after attempts: [${attempt}/${maxAttempts}] ${error.message}`);
                }
                await new Promise((resolve) => setTimeout(resolve, 11000));
            }
        }
        throw new Error("Failed to calculate distribution amounts");
    }

    static async sendTransactionWithInstructions({ instructions, instructionsCallback, feePayer, signers, maxRetries = 10, statusCheckDelay = 10000, transactionType, }) {
        const globalConfig = GlobalConfig_1.default.getInstance();
        let retries = maxRetries;
        let success = false;
        let signature = null;
        let attempt = 1;
        while (!success && retries > 0) {
            try {
                const txInstructions = instructionsCallback
                    ? await instructionsCallback()
                    : instructions;
                if (!txInstructions) {
                    throw new Error("No transaction instructions provided.");
                }
                const transaction = new web3_js_1.Transaction();
                transaction.add(...txInstructions);
                const { blockhash } = await globalConfig.CONNECTION.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = feePayer;
                transaction.sign(...signers);
                signature = await globalConfig.CONNECTION.sendTransaction(transaction, signers, { skipPreflight: false });
                (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Transaction: ${transactionType} was sent attempt: [${attempt}/${maxRetries}]`);
                success = await this.waitForFinalization(signature, 5, statusCheckDelay, transactionType);
                if (!success) {
                    retries--;
                }
            }
            catch (error) {
                (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Error sending transaction: ${transactionType}, reason: ${error}`);
                retries--;
                await new Promise((resolve) => setTimeout(resolve, statusCheckDelay));
            }
            attempt++;
        }
        if (!success) {
            throw new Error(`Transaction: ${transactionType} failed to finalize after [${attempt}/${maxRetries}] attempts.`);
        }
        (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Transaction: ${transactionType} was confirmed`);
        return signature;
    }

    static async waitForFinalization(signature, maxRetries = 10, delay = 5000, transactionType) {
        const globalConfig = GlobalConfig_1.default.getInstance();
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 11000));
            try {
                const transaction = await globalConfig.CONNECTION.getTransaction(signature, {
                    commitment: "finalized",
                });
                if (!transaction) {
                    (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Transaction: ${transactionType} not finalized yet. Retrying...`);
                }
                else {
                    return true;
                }
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            catch (error) {
                (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Error checking transaction: ${transactionType} status: ${error.message}`);
            }
        }
        (0, Logger_1.logMessage)(Logger_1.LogLevel.WARN, `Transaction: ${transactionType} with signature ${signature} was not finalized after ${maxRetries} attempts.`);
        return false;
    }

    static async getAssociatedTokenAccount(ownerWallet) {
        try {
            const globalConfig = GlobalConfig_1.default.getInstance();
            const mintAccountInfo = await globalConfig.CONNECTION.getAccountInfo(globalConfig.MINT_ADDRESS);
            if (!mintAccountInfo) {
                throw new Error(`Mint address is invalid: ${globalConfig.MINT_ADDRESS.toBase58()}`);
            }
            const tokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(globalConfig.MINT_ADDRESS, ownerWallet);
            return tokenAccount;
        }
        catch (error) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error retrieving associated token account for ${ownerWallet.toBase58()}: ${error.message}`);
            throw error;
        }
    }
    static async getOrCreateTokenAcount(ownerWallet, payer) {
        try {
            const globalConfig = GlobalConfig_1.default.getInstance();
            const mintAccountInfo = await globalConfig.CONNECTION.getAccountInfo(globalConfig.MINT_ADDRESS);
            if (!mintAccountInfo) {
                throw new Error(`Mint address is invalid: ${globalConfig.MINT_ADDRESS.toBase58()}`);
            }
            const tokenAccount = (0, spl_token_1.getOrCreateAssociatedTokenAccount)(globalConfig.CONNECTION, payer, globalConfig.MINT_ADDRESS, ownerWallet);
            return tokenAccount;
        }
        catch (error) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, `Error retrieving/creating associated token account for ${ownerWallet.toBase58()}: ${error.message}`);
            throw error;
        }
    }

    static getMinimumTpPercentage(tipPercentageInput) {
        let tipPercentage = BigInt(tipPercentageInput);
        if (tipPercentage < 5n) {
            tipPercentage = 5n;
        }
        return tipPercentage;
    }

    static async getSolanaRemainingBalance(fromBalance, connection, fromPublicKey, toPublicKey, feePayer) {
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: fromBalance,
        }));
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = feePayer;
        const message = transaction.compileMessage();
        const fee = await connection.getFeeForMessage(message);
        if (fee === null) {
            throw new Error("Failed to fetch transaction fee.");
        }
        return fromBalance - fee.value;
    }
}
exports.SolanaUtils = SolanaUtils;
