export const environmentConfig = {
    nodeEnv: process.env.NODE_ENV || "development",

    serverPort: Number(process.env.SERVER_PORT) || 3000,

    serverHost: process.env.SERVER_HOST || "localhost"
};