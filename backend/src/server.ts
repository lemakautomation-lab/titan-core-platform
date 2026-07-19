import app from "./app";
import { applicationConfig } from "./config/application.config";
import { serverConfig } from "./config/server.config";

app.listen(serverConfig.port, () => {
    console.log(
        `${applicationConfig.name} v${applicationConfig.version} running on ${serverConfig.host}:${serverConfig.port}`
    );
});