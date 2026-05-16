import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../../common/enums";
import { IUser } from "../../../common/interfaces";
import { HydratedDocument } from "mongoose";

// GRAPHQL ENUM TYPES
export const GenderGQLEnumType = new GraphQLEnumType({
  name: "GenderGQLEnumType",
  values: {
    Male: { value: GenderEnum.MALE },
    Female: { value: GenderEnum.FEMALE },
  },
});
export const ProviderGQLEnumType = new GraphQLEnumType({
  name: "ProviderGQLEnumType",
  values: {
    Google: { value: ProviderEnum.GOOGLE },
    System: { value: ProviderEnum.SYSTEM },
  },
});
export const RoleGQLEnumType = new GraphQLEnumType({
  name: "RoleGQLEnumType",
  values: {
    Admin: { value: RoleEnum.ADMIN },
    User: { value: RoleEnum.USER },
  },
});

export const OneUserType: GraphQLObjectType = new GraphQLObjectType({
  name: "OneUserType",
  fields: () => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    username: {
      type: GraphQLString,
      resolve: (parent: HydratedDocument<IUser>) => {
        console.log({ parent: parent });
        return parent.gender === GenderEnum.MALE
          ? `Mr.${parent.username}`
          : `Mrs.${parent.username}`;
      },
    },

    slug: { type: new GraphQLNonNull(GraphQLString) },

    email: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: GraphQLString },
    phone: { type: GraphQLString },
    profilePicture: { type: GraphQLString },
    profileCoverPictures: { type: new GraphQLList(GraphQLString) },

    friends: { type: new GraphQLList(OneUserType) },

    gender: { type: GenderGQLEnumType },
    role: { type: RoleGQLEnumType },
    provider: { type: ProviderGQLEnumType },

    changeCredentialsTime: { type: GraphQLString },
    DOB: { type: GraphQLString },
    confirmEmail: { type: GraphQLString },

    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    updatedAt: { type: GraphQLString },
    deletedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },
  }),
});

export const profile = new GraphQLNonNull(
  new GraphQLObjectType({
    name: "ProfileResponse",
    description: "",
    fields: {
      message: {
        type: new GraphQLNonNull(GraphQLString),
      },
      data: {
        type: OneUserType,
      },
    },
  }),
);
