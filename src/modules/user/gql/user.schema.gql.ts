import { GraphQLString } from "graphql";
import * as UserGQLTypes from "./user.types.gql";
import * as UserGQLArgs from "./user.args.gql";
import { UserResolver, userResolver } from "./user.resolver";

export class UserGQLSchema {
  private userResolver: UserResolver;

  constructor() {
    this.userResolver = userResolver;
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
        type: GraphQLString,
        description: "Test Hello Endpoint",
        resolve: () => {
          return "Hello, from mutation";
        },
      },
      Welcome: {
        type: GraphQLString,
        description: "Test Hello Endpoint",
        resolve: () => {
          return "Welcome, from mutation";
        },
      },
    };
  }
}

export const userGQLSchema = new UserGQLSchema();
