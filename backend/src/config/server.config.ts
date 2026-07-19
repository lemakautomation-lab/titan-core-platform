export const serverConfig = {
    port: Number(process.env.SERVER_PORT) || 3000,

    host: process.env.SERVER_HOST || "localhost",

    environment: process.env.NODE_ENV || "development"
};