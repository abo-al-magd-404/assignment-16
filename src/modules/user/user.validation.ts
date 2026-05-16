import { z } from "zod";

export const profileGQL = z.strictObject({
  search: z.string().min(2).optional(),
});
