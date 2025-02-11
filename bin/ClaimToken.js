"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimNode = claimNode;
exports.claimTokenBatch = claimTokenBatch;
const axios_1 = __importDefault(require("axios"));
const bs58_1 = __importDefault(require("bs58"));
const chalk_1 = __importDefault(require("chalk"));
const web3_js_1 = require("@solana/web3.js");
const Logger_1 = require("./Logger");
const SolanaUtils_js_1 = require("./SolanaUtils.js");
const TokenChecker_js_1 = require("./TokenChecker.js");
const Utils_js_1 = require("./Utils.js");
const GlobalConfig_js_1 = __importDefault(require("./GlobalConfig.js"));
const BASE_URL = 'https://claim.nodefoundation.ai/api/allocations';
async function getDistributionIdForWallet(wallet) {
    try {
        const allocationResponse = await axios_1.default.get(`${BASE_URL}?wallet=${wallet}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Origin': 'https://claim.nodefoundation.ai',
                'Referer': 'https://claim.nodefoundation.ai/'
            }
        });
        const allocation = allocationResponse.data[0];
        if (!allocation) {
            throw new Error('No allocation found');
        }
        const distributionId = allocation.id;
        if (!distributionId) {
            throw new Error('Distribution ID not found in allocation');
        }
        return distributionId;
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'error while retrieving distribution ID:');
        if (axios_1.default.isAxiosError(error)) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Response:' + error.response?.data);
        }
        throw error;
    }
}
async function getTransactionData(wallet, log = true) {
    try {
        const distributionId = await getDistributionIdForWallet(wallet);
        const paramsResponse = await axios_1.default.get(`https://claim.nodefoundation.ai/api/parameters?distributionId=${distributionId}&wallet=${wallet}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Origin': 'https://claim.nodefoundation.ai',
                'Referer': 'https://claim.nodefoundation.ai/',
                'Connection': 'keep-alive'
            }
        });
        const { inputs } = paramsResponse.data;
        const parsedInputs = JSON.parse(inputs);
        if (log) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, 'Successfully retrieved transaction data');
        }
        return {
            instructionData: parsedInputs
        };
    }
    catch (error) {
        if (log) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Error while retrieving transaction data:');
            if (axios_1.default.isAxiosError(error)) {
                (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Status:' + error.response?.status);
                (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Response:' + error.response?.data);
            }
        }
        throw error;
    }
}
async function claimNode(privateKey, walletNumber) {
    const walletKeyPair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKey));
    try {
        let tokenBalance = await (0, TokenChecker_js_1.getBalance)(walletKeyPair.publicKey);
        if (tokenBalance <= 0) {
            (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, (0, Logger_1.messageWithWallet)(walletNumber, 'Skipping... Wallet alredy claimed or no token for claim'));
            return {
                wallet: privateKey,
                status: 'Skipped'
            };
        }
        else {
            {
                (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, (0, Logger_1.messageWithWallet)(walletNumber, `Processing wallet: ${chalk_1.default.underline(walletKeyPair.publicKey.toBase58())}`));
                const { instructionData } = await getTransactionData(walletKeyPair.publicKey.toBase58(), false);
                if (!instructionData || !Array.isArray(instructionData)) {
                    throw new Error('Invalid transaction instructions');
                }
                let instructions = [];
                for (const instruction of instructionData) {
                    instructions.push(new web3_js_1.TransactionInstruction({
                        programId: new web3_js_1.PublicKey(instruction.programId),
                        keys: instruction.keys.map((key) => ({
                            pubkey: new web3_js_1.PublicKey(key.pubkey),
                            isSigner: key.isSigner,
                            isWritable: key.isWritable
                        })),
                        data: Buffer.from(instruction.data || '', 'base64')
                    }));
                }
                try {
                    await SolanaUtils_js_1.SolanaUtils.sendTransactionWithInstructions({ instructions: instructions, feePayer: walletKeyPair.publicKey, signers: [walletKeyPair], transactionType: "| Claim token |" });
                    (0, Logger_1.logMessage)(Logger_1.LogLevel.INFO, `Claim tokens was successfully`);
                    return {
                        wallet: privateKey,
                        status: 'Success',
                    };
                }
                catch (error) {
                    return {
                        wallet: privateKey,
                        status: 'Error',
                        error: error
                    };
                }
            }
        }
    }
    catch (transactionError) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Error while sending transaction:' + transactionError.message);
        return {
            wallet: privateKey,
            status: 'Error',
            error: transactionError.message
        };
    }
}
async function claimTokenBatch() {
    const config = GlobalConfig_js_1.default.getInstance();
    const wallets = config.WALLETS;
    try {
        await (0, Utils_js_1.batchProcess)(wallets, claimNode, config.THREADS, 5000, "claim token");
    }
    catch (error) {
        (0, Logger_1.logMessage)(Logger_1.LogLevel.ERROR, 'Critical error:' + error);
    }
}
