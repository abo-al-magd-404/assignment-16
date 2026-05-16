import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { OneUserType } from "../../user/gql/user.types.gql";
import { availabilityEnum } from "../../../common/enums";

// REACTION PART
export const ReactionGQLType = new GraphQLObjectType({
  name: "ReactionGQLType",
  fields: {
    user: {
      type: OneUserType,
    },

    type: {
      type: GraphQLInt,
    },
  },
});

// AVAILABILITY ENUM
export const AvailabilityGQLEnumType = new GraphQLEnumType({
  name: "AvailabilityGQLEnumType",
  values: {
    Public: { value: availabilityEnum.PUBLIC },
    Friends: { value: availabilityEnum.FRIENDS },
    Only_me: { value: availabilityEnum.ONLY_ME },
  },
});

export const OnePostType = new GraphQLObjectType({
  name: "OnePostType",
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLID) },
    folderId: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: GraphQLString },
    attachments: { type: new GraphQLList(GraphQLString) },

    reactions: { type: new GraphQLList(ReactionGQLType) },
    tags: { type: new GraphQLList(OneUserType) },
    availability: { type: AvailabilityGQLEnumType },

    createdBy: { type: new GraphQLNonNull(OneUserType) },
    updatedBy: { type: OneUserType },

    createdAt: { type: new GraphQLNonNull(GraphQLString) },
    deletedAt: { type: GraphQLString },
    restoredAt: { type: GraphQLString },
    updatedAt: { type: GraphQLString },
  },
});

export const PostList = new GraphQLObjectType({
  name: "PostListResponse",
  fields: {
    message: { type: new GraphQLNonNull(GraphQLString) },
    data: {
      type: new GraphQLObjectType({
        name: "PostPaginationResponse",
        fields: {
          docs: { type: new GraphQLList(OnePostType) },
          currentPage: { type: GraphQLInt },
          size: { type: GraphQLInt },
          pages: { type: GraphQLInt },
        },
      }),
    },
  },
});

export const reactPost = new GraphQLObjectType({
  name: "ReactPostResponse",
  fields: {
    message: { type: new GraphQLNonNull(GraphQLString) },
    data: { type: OnePostType },
  },
});
