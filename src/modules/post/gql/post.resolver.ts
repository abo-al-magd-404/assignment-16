import { IAuthUser } from "./../../../common/types/express.types";
import { postService, PostService } from "../post.service";
import { GQLValidation } from "../../../middleware";
import {
  PaginateDto,
  paginationValidationSchema,
} from "../../../common/validation";
import { reactPostGQL } from "../post.validation";
import { ReactPostArgsDto } from "../post.dto";

export class PostResolver {
  private postService: PostService;
  constructor() {
    this.postService = postService;
  }

  postList = async (
    parent: unknown,
    args: PaginateDto,
    { user }: IAuthUser,
  ) => {
    await GQLValidation<PaginateDto>(paginationValidationSchema.query, args);

    const data = await this.postService.postList(args, user);
    return { message: "Done", data };
  };

  reactPost = async (
    parent: unknown,
    { postId, react }: ReactPostArgsDto,
    { user }: IAuthUser,
  ) => {
    await GQLValidation<ReactPostArgsDto>(reactPostGQL, { postId, react });

    const data = await this.postService.reactPost({ postId }, { react }, user);
    return { message: "Done", data };
  };
}
export const postResolver = new PostResolver();
