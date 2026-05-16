import { HydratedDocument } from "mongoose";
import { availabilityEnum } from "../enums";
import { IUser } from "../interfaces";

export const getAvailability = (user: HydratedDocument<IUser>) => {
  return [
    { availability: availabilityEnum.PUBLIC },
    { availability: availabilityEnum.ONLY_ME, createdBy: user._id },
    {
      availability: availabilityEnum.FRIENDS,
      createdBy: { $in: [user._id, ...(user.friends || [])] },
    },
    { tags: { $in: [user._id] } },
  ];
};
