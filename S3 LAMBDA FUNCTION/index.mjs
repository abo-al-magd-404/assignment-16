import { config } from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

config();

const MONGO_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;

let client;
let db;

const connectDB = async () => {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log("Connected to MongoDB");
  }
};

export const handler = async (event) => {
  await connectDB();
  const users = db.collection("SOCIAL_APP_USERS");

  for (const record of event.Records) {
    try {
      let fullKey = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, " "),
      );

      console.log("Processing S3 Key:", fullKey);

      const parts = fullKey.split("/");
      const customId = parts[2];

      if (!customId) {
        console.warn("Invalid Key Format (No ID found):", fullKey);
        continue;
      }

      const lastDotIndex = fullKey.lastIndexOf(".");
      const keyWithoutExtension =
        lastDotIndex !== -1 ? fullKey.substring(0, lastDotIndex) : fullKey;

      console.log("Clean Key (No Extension):", keyWithoutExtension);

      const result = await users.updateOne(
        { _id: new ObjectId(customId) },
        {
          $set: {
            profilePicture: keyWithoutExtension,
            updateAt: new Date(),
          },
        },
      );

      console.log("Update Success:", {
        customId,
        matched: result.matchedCount,
        modified: result.modifiedCount,
      });
    } catch (error) {
      console.error("Lambda error for record:", error);
    }
  }
};
