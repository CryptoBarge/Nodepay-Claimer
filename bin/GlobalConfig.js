"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const Utils_1 = require("./Utils");
class GlobalConfig {
    constructor() {
        const config = (0, Utils_1.loadJSONConfig)("../data/config.json");
        this.VAULT_WALLET = new web3_js_1.PublicKey(config.VAULT_WALLET);
        this.MASTER_WALLET = config.MASTER_WALLET?.trim() ? web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(config.MASTER_WALLET)) : undefined;
        this.MINT_ADDRESS = new web3_js_1.PublicKey("B89Hd5Juz7JP2dxCZXFJWk4tMTcbw7feDhuWGb3kq5qE");
        this.WALLETS = (0, Utils_1.loadWalletsFromFile)("../data/wallets.txt");
        this.CHECKED_WALLETS = (0, Utils_1.loadWalletsFromFile)("../data/checked_wallets.txt");
        this.MIN_TOKEN_AMOUNT = Number(config.MIN_TOKEN_AMOUNT);
        this.THREADS = config.THREADS;
        this.USE_PROXY = config.USE_PROXY;
        this.TIP_PERCENTAGE = BigInt(config.TIP_AMOUNT * 100);
        this.RPC_ENDPOINT = config.RPC_ENDPOINT?.trim() ? config.RPC_ENDPOINT : ((0, web3_js_1.clusterApiUrl)("mainnet-beta"));
        this.CONNECTION = new web3_js_1.Connection(this.RPC_ENDPOINT, "confirmed");
    }
    static getInstance() {
        if (!GlobalConfig.instance) {
            GlobalConfig.instance = new GlobalConfig();
        }
        return GlobalConfig.instance;
    }
}
exports.default = GlobalConfig;
//# sourceMappingURL=GlobalConfig.js.map