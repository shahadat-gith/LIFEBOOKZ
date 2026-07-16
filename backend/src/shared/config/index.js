import dotenv from "dotenv";
dotenv.config();

const config = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10),

  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    key: process.env.ADMIN_KEY,
  },

  mail: {
    user: process.env.APP_MAIL_USERNAME,
    password: process.env.APP_MAIL_PASSWORD,
  },

  aws: {
    region: "ap-south-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sqs: {
      queueUrl: process.env.SQS_QUEUE_URL,
    },
  },

  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    secretKey: process.env.CLOUDINARY_API_SECRET,
  },

  qdrant: {
    url: process.env.QDRANT_ENDPOINT,
    apiKey: process.env.QDRANT_API_KEY,
    vectorSize: 512,
    collections: {
      user: "lifebookz_user_embeddings",
      story: "lifebookz_story_embeddings",
    },
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    chatModel: process.env.OPENROUTER_MODEL,
    embeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL,
    baseUrl: process.env.OPENROUTER_BASE_URL,
  },

  frontendUrl: process.env.FRONTEND_URL,
};

export default config;
