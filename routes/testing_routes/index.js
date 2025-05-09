"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const coins_1 = __importDefault(require("./coins"));
const trades_1 = __importDefault(require("./trades"));
const prices_1 = __importDefault(require("./prices"));
const messages_1 = __importDefault(require("./messages"));
const koth_1 = __importDefault(require("./koth"));
const utils_1 = __importDefault(require("./utils"));
const notify_1 = __importDefault(require("./notify"));
const router = express_1.default.Router();
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://www.memehome.io",
    "http://localhost:4173/"
];
router.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// Use all the route files
router.use(coins_1.default);
router.use(trades_1.default);
router.use(prices_1.default);
router.use(messages_1.default);
router.use(koth_1.default);
router.use(utils_1.default);
router.use(notify_1.default);
exports.default = router;
