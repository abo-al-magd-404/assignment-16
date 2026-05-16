import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { userGQLSchema } from "../user";
import { postGQLSchema } from "../post";

const query = new GraphQLObjectType({
  name: "RootSchemaQuery",
  description: "optional text to enhance understand api (query)",
  fields: {
    ...userGQLSchema.registerQuery(),
    ...postGQLSchema.registerQuery(),
  },
});

const mutation = new GraphQLObjectType({
  name: "RootSchemaMutation",
  description: "optional text to enhance understand api (mutation)",
  fields: {
    ...userGQLSchema.registerMutation(),
    ...postGQLSchema.registerMutation(),
  },
});

export const schema = new GraphQLSchema({
  query,
  mutation,
});
