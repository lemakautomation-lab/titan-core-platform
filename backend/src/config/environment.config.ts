const validEnvironments = [
    "development",
    "testing",
    "staging",
    "production"
] as const;

const nodeEnv = process.env.NODE_ENV || "development";

if (!validEnvironments.includes(nodeEnv as typeof validEnvironments[number])) {
    throw new Error(
        `Invalid NODE_ENV value: ${nodeEnv}`
    );
}

const serverPort = Number(process.env.SERVER_PORT || 3000);

if (Number.isNaN(serverPort) || serverPort <= 0 || serverPort > 65535) {
    throw new Error(
        `Invalid SERVER_PORT value: ${process.env.SERVER_PORT}`
    );
}

const serverHost = process.env.SERVER_HOST || "localhost";

export const environmentConfig = {
    nodeEnv,
    serverPort,
    serverHost
};