import "dotenv/config";
import app from "./app";
import { applicationConfig } from "./config/application.config";
import { serverConfig } from "./config/server.config";
import { logger } from "./logging/logger";

const server =
    app.listen(serverConfig.port, () => {

        logger.info(
            `${applicationConfig.name} v${applicationConfig.version} running on ${serverConfig.host}:${serverConfig.port}`
        );

        console.log(
            "SERVER LISTENING:",
            server.address()
        );

    });


server.on("close", () => {

    console.log(
        "SERVER CLOSE EVENT FIRED"
    );

});


server.on("error", (error) => {

    console.log(
        "SERVER ERROR",
        error
    );

});


process.on("exit", (code) => {

    console.log(
        "PROCESS EXIT",
        code
    );

});


process.on("beforeExit", (code) => {

    console.log(
        "BEFORE EXIT",
        code
    );

});
