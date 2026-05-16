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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userGQLSchema = exports.UserGQLSchema = void 0;
const graphql_1 = require("graphql");
const UserGQLTypes = __importStar(require("./user.types.gql"));
const UserGQLArgs = __importStar(require("./user.args.gql"));
const user_resolver_1 = require("./user.resolver");
class UserGQLSchema {
    userResolver;
    constructor() {
        this.userResolver = user_resolver_1.userResolver;
    }
    registerQuery() {
        return {
            profile: {
                description: "Test profile Endpoint",
                type: UserGQLTypes.profile,
                args: UserGQLArgs.profile,
                resolve: this.userResolver.profile,
            },
        };
    }
    registerMutation() {
        return {
            Hello: {
                type: graphql_1.GraphQLString,
                description: "Test Hello Endpoint",
                resolve: () => {
                    return "Hello, from mutation";
                },
            },
            Welcome: {
                type: graphql_1.GraphQLString,
                description: "Test Hello Endpoint",
                resolve: () => {
                    return "Welcome, from mutation";
                },
            },
        };
    }
}
exports.UserGQLSchema = UserGQLSchema;
exports.userGQLSchema = new UserGQLSchema();
