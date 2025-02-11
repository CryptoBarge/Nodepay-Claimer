"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
exports.logMessage = logMessage;
exports.messageWithWallet = messageWithWallet;
const chalk_1 = __importDefault(require("chalk"));
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
    LogLevel["SUCCESS"] = "SUCCESS";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
function logMessage(level, message) {
    const now = new Date();
    const localTime = now.toLocaleTimeString('en-US', { hour12: false });
    const timestamp = chalk_1.default.green(localTime); // Date in gray
    const levelColor = {
        INFO: chalk_1.default.blue.bold('[INFO]'),
        WARN: chalk_1.default.yellow.bold('[WARN]'),
        ERROR: chalk_1.default.red.bold('[ERROR]'),
        SUCCESS: chalk_1.default.green.bold('[SUCCESS]'),
    };
    const levelText = levelColor[level];
    console.log(`${timestamp} ${levelText} ${chalk_1.default.whiteBright(message)}`);
}
function messageWithWallet(walletNumber, message) {
    return `${walletNumber ?? ""} | ${message}`;
}
