import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums";

export interface IUser {
  firstName: string;
  lastName: string;
  username?: string;

  slug: string;

  email: string;
  phone?: string | undefined;
  password: string;
  profilePicture?: string;
  profileCoverPictures?: string[];

  friends?: Types.ObjectId[] | IUser[];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
