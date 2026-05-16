import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { availabilityEnum } from "../enums";

export interface IPost {
  folderId: string;
  content?: string;
  attachments?: string[];

  reactions?: {
    user: Types.ObjectId | IUser;
    type: number;
  }[];
  tags?: Types.ObjectId[] | IUser[];
  availability: availabilityEnum;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  updatedAt?: Date;
}
