import {
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";

export const ReactGQLEnumType = new GraphQLEnumType({
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

export const PostList = {
  page: { type: GraphQLInt },
  size: { type: GraphQLInt },
  search: { type: GraphQLString },
};

export const reactPost = {
  postId: { type: new GraphQLNonNull(GraphQLID) },
  react: {
    type: ReactGQLEnumType,
  },
};
