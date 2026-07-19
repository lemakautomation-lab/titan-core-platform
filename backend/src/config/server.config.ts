import { environmentConfig } from "./environment.config";

export const serverConfig = {
    port: environmentConfig.serverPort,

    host: environmentConfig.serverHost,

    environment: environmentConfig.nodeEnv
};