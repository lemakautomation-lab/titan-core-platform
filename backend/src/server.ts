import "dotenv/config";
import app from "./app";
import { applicationConfig } from "./config/application.config";
import { serverConfig } from "./config/server.config";
import { logger } from "./logging/logger";

app.listen(serverConfig.port, () => {
    logger.info(
        `${applicationConfig.name} v${applicationConfig.version} running on ${serverConfig.host}:${serverConfig.port}`
    );
});