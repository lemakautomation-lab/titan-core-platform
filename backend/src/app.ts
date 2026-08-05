import express from "express";
import helmet from "helmet";

import routes from "./routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { requestContextMiddleware } from "./middleware/request-context.middleware";
import { requestMetricsMiddleware } from "./middleware/request-metrics.middleware";
import { apiRateLimiter } from "./middleware/rate-limit.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();

app.use(helmet());

app.use(requestIdMiddleware);

app.use(requestContextMiddleware);

app.use(requestMetricsMiddleware);

app.use(apiRateLimiter);

app.use(express.json({
    limit: "1mb",
}));

app.use(express.urlencoded({
    extended: false,
    limit: "1mb",
}));

app.use(requestLogger);

app.use("/", routes);

app.use(errorHandler);

export default app;
