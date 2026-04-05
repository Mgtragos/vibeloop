"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
var common_1 = require("@nestjs/common");
var websockets_1 = require("@nestjs/websockets");
var ChatGateway = function () {
    var _a;
    var _classDecorators = [(0, websockets_1.WebSocketGateway)({
            namespace: '/chat',
            cors: { origin: (_a = process.env['CORS_ORIGIN']) !== null && _a !== void 0 ? _a : 'http://localhost:3000', credentials: true },
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _server_decorators;
    var _server_initializers = [];
    var _server_extraInitializers = [];
    var _handleJoinQueue_decorators;
    var _handleSignal_decorators;
    var _handleSkip_decorators;
    var ChatGateway = _classThis = /** @class */ (function () {
        function ChatGateway_1(redis, match) {
            this.redis = (__runInitializers(this, _instanceExtraInitializers), redis);
            this.match = match;
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.logger = (__runInitializers(this, _server_extraInitializers), new common_1.Logger(ChatGateway.name));
        }
        // ── Lifecycle ────────────────────────────────────────────────────────────────
        ChatGateway_1.prototype.handleConnection = function (client) {
            this.logger.log("Connected: ".concat(client.id));
        };
        ChatGateway_1.prototype.handleDisconnect = function (client) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log("Disconnected: ".concat(client.id));
                            return [4 /*yield*/, this.cleanup(client, 'disconnect')];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── chat:join-queue ──────────────────────────────────────────────────────────
        ChatGateway_1.prototype.handleJoinQueue = function (payload, client) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, candidate, candidateSocketId, position;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            userId = payload.userId;
                            if (!(userId === null || userId === void 0 ? void 0 : userId.trim())) {
                                client.emit('chat:error', { message: 'userId is required' });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.redis.setSocketUser(client.id, userId)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.match.tryMatch(userId)];
                        case 2:
                            candidate = _a.sent();
                            if (!candidate) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.redis.getUserSocket(candidate)];
                        case 3:
                            candidateSocketId = _a.sent();
                            client.emit('chat:matched', { partnerId: candidate, initiator: true });
                            if (candidateSocketId) {
                                this.server
                                    .to(candidateSocketId)
                                    .emit('chat:matched', { partnerId: userId, initiator: false });
                            }
                            this.logger.log("Matched: ".concat(userId, " \u2194 ").concat(candidate));
                            return [3 /*break*/, 6];
                        case 4: return [4 /*yield*/, this.match.queuePosition(userId)];
                        case 5:
                            position = _a.sent();
                            client.emit('chat:queued', { position: position });
                            this.logger.log("Queued: ".concat(userId, " at position ").concat(position));
                            _a.label = 6;
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        // ── chat:signal ──────────────────────────────────────────────────────────────
        ChatGateway_1.prototype.handleSignal = function (payload, client) {
            return __awaiter(this, void 0, void 0, function () {
                var to, signal, senderId, targetUserId, session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            to = payload.to, signal = payload.signal;
                            if (!to || signal === undefined) {
                                client.emit('chat:error', { message: 'signal payload must include `to` and `signal`' });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.redis.getSocketUser(client.id)];
                        case 1:
                            senderId = _a.sent();
                            if (!senderId) {
                                client.emit('chat:error', { message: 'Not authenticated — join the queue first' });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.redis.getSocketUser(to)];
                        case 2:
                            targetUserId = _a.sent();
                            if (!targetUserId) {
                                client.emit('chat:error', { message: 'Recipient socket not found' });
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.match.getSession(senderId)];
                        case 3:
                            session = _a.sent();
                            if (session !== targetUserId) {
                                client.emit('chat:error', { message: 'You are not in a session with this user' });
                                return [2 /*return*/];
                            }
                            this.server.to(to).emit('chat:signal', { from: client.id, signal: signal });
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── chat:skip ────────────────────────────────────────────────────────────────
        ChatGateway_1.prototype.handleSkip = function (client) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.cleanup(client, 'skip')];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── Helpers ──────────────────────────────────────────────────────────────────
        ChatGateway_1.prototype.cleanup = function (client, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var userId, partnerId, partnerSocketId, position, position;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.redis.getSocketUser(client.id)];
                        case 1:
                            userId = _a.sent();
                            if (!userId)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.match.removeFromQueue(userId)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, this.match.getSession(userId)];
                        case 3:
                            partnerId = _a.sent();
                            if (!partnerId) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.match.endSession(userId, partnerId)];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.redis.getUserSocket(partnerId)];
                        case 5:
                            partnerSocketId = _a.sent();
                            if (!partnerSocketId) return [3 /*break*/, 7];
                            this.server.to(partnerSocketId).emit('chat:partner-left', { reason: reason });
                            if (!(reason === 'skip')) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.match.requeueUser(partnerId)];
                        case 6:
                            position = _a.sent();
                            this.server.to(partnerSocketId).emit('chat:queued', { position: position });
                            _a.label = 7;
                        case 7:
                            if (!(reason === 'skip')) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.match.requeueUser(userId)];
                        case 8:
                            position = _a.sent();
                            client.emit('chat:queued', { position: position });
                            return [3 /*break*/, 11];
                        case 9: return [4 /*yield*/, this.redis.removeSocketUser(client.id, userId)];
                        case 10:
                            _a.sent();
                            _a.label = 11;
                        case 11:
                            this.logger.log("Cleanup [".concat(reason, "]: ").concat(userId));
                            return [2 /*return*/];
                    }
                });
            });
        };
        return ChatGateway_1;
    }());
    __setFunctionName(_classThis, "ChatGateway");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _handleJoinQueue_decorators = [(0, websockets_1.SubscribeMessage)('chat:join-queue')];
        _handleSignal_decorators = [(0, websockets_1.SubscribeMessage)('chat:signal')];
        _handleSkip_decorators = [(0, websockets_1.SubscribeMessage)('chat:skip')];
        __esDecorate(_classThis, null, _handleJoinQueue_decorators, { kind: "method", name: "handleJoinQueue", static: false, private: false, access: { has: function (obj) { return "handleJoinQueue" in obj; }, get: function (obj) { return obj.handleJoinQueue; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleSignal_decorators, { kind: "method", name: "handleSignal", static: false, private: false, access: { has: function (obj) { return "handleSignal" in obj; }, get: function (obj) { return obj.handleSignal; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleSkip_decorators, { kind: "method", name: "handleSkip", static: false, private: false, access: { has: function (obj) { return "handleSkip" in obj; }, get: function (obj) { return obj.handleSkip; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: function (obj) { return "server" in obj; }, get: function (obj) { return obj.server; }, set: function (obj, value) { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatGateway = _classThis;
}();
exports.ChatGateway = ChatGateway;
//# sourceMappingURL=chat.gateway.js.map