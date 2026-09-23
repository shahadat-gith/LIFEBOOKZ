import dotenv from "dotenv";
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "dev",
  port: parseInt(process.env.PORT, 10) || 5000,

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    key: process.env.ADMIN_KEY,
  },

  developer: {
    email: process.env.DEVELOPER_EMAIL,
    password: process.env.DEVELOPER_PASSWORD,
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  },

  aws:{
    region:"ap-south-1",
    key:{
      access:process.env.AWS_ACCESS_KEY,
      secret:process.env.AWS_SECRET_KEY
    },

    ses:{
      fromName:"Lifebookz",
      fromMail:"noreply@lifebookz.com"
    }
  },
  frontend: {
    admin: process.env.FRONTEND_ADMIN_URL,
    client: process.env.FRONTEND_CLIENT_URL,
    author: process.env.FRONTEND_AUTHOR_URL,
    expert: process.env.FRONTEND_EXPERT_URL,
    developer: process.env.FRONTEND_DEVELOPER_URL,
  },
};

export default config;
