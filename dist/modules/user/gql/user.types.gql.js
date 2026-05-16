"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profile = exports.OneUserType = exports.RoleGQLEnumType = exports.ProviderGQLEnumType = exports.GenderGQLEnumType = void 0;
const graphql_1 = require("graphql");
const enums_1 = require("../../../common/enums");
exports.GenderGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "GenderGQLEnumType",
    values: {
        Male: { value: enums_1.GenderEnum.MALE },
        Female: { value: enums_1.GenderEnum.FEMALE },
    },
});
exports.ProviderGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "ProviderGQLEnumType",
    values: {
        Google: { value: enums_1.ProviderEnum.GOOGLE },
        System: { value: enums_1.ProviderEnum.SYSTEM },
    },
});
exports.RoleGQLEnumType = new graphql_1.GraphQLEnumType({
    name: "RoleGQLEnumType",
    values: {
        Admin: { value: enums_1.RoleEnum.ADMIN },
        User: { value: enums_1.RoleEnum.USER },
    },
});
exports.OneUserType = new graphql_1.GraphQLObjectType({
    name: "OneUserType",
    fields: () => ({
        _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
        firstName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        lastName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        username: {
            type: graphql_1.GraphQLString,
            resolve: (parent) => {
                console.log({ parent: parent });
                return parent.gender === enums_1.GenderEnum.MALE
                    ? `Mr.${parent.username}`
                    : `Mrs.${parent.username}`;
            },
        },
        slug: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        password: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        profilePicture: { type: graphql_1.GraphQLString },
        profileCoverPictures: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        friends: { type: new graphql_1.GraphQLList(exports.OneUserType) },
        gender: { type: exports.GenderGQLEnumType },
        role: { type: exports.RoleGQLEnumType },
        provider: { type: exports.ProviderGQLEnumType },
        changeCredentialsTime: { type: graphql_1.GraphQLString },
        DOB: { type: graphql_1.GraphQLString },
        confirmEmail: { type: graphql_1.GraphQLString },
        createdAt: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
        updatedAt: { type: graphql_1.GraphQLString },
        deletedAt: { type: graphql_1.GraphQLString },
        restoredAt: { type: graphql_1.GraphQLString },
    }),
});
exports.profile = new graphql_1.GraphQLNonNull(new graphql_1.GraphQLObjectType({
    name: "ProfileResponse",
    description: "",
    fields: {
        message: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
        },
        data: {
            type: exports.OneUserType,
        },
    },
}));
