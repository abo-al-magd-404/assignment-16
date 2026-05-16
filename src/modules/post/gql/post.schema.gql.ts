import * as PostGQLTypes from "./post.types.gql";
import * as PostGQLArgs from "./post.args.gql";
import { postResolver, PostResolver } from "./post.resolver";

export class PostGQLSchema {
  private postResolver: PostResolver;

  constructor() {
    this.postResolver = postResolver;
  }

  registerQuery() {
    return {
      postList: {
        type: PostGQLTypes.PostList,
        args: PostGQLArgs.PostList,
        resolve: this.postResolver.postList,
      },
    };
  }

  registerMutation() {
    return {
      reactPost: {
        type: PostGQLTypes.reactPost,
        args: PostGQLArgs.reactPost,
        resolve: this.postResolver.reactPost,
      },
    };
  }
}
export const postGQLSchema = new PostGQLSchema();
