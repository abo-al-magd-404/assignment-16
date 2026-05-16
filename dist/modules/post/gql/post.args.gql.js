"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactPost = exports.PostList = exports.ReactGQLEnumType = void 0;
const graphql_1 = require("graphql");
exports.ReactGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "ReactEnum",
    values: {
        DISLIKE: { value: 0 },
        LIKE: { value: 1 },
        LOVE: { value: 2 },
        FUNNY: { value: 3 },
        SAD: { value: 4 },
        ANGRY: { value: 5 },
    },
});
exports.PostList = {
    page: { type: graphql_1.GraphQLInt },
    size: { type: graphql_1.GraphQLInt },
    search: { type: graphql_1.GraphQLString },
};
exports.reactPost = {
    postId: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
    react: {
        type: exports.ReactGQLEnumType,
    },
};
