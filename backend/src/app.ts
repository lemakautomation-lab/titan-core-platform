import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import routes from "./routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { requestContextMiddleware } from "./middleware/request-context.middleware";
import { requestMetricsMiddleware } from "./middleware/request-metrics.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";
import { rateLimitModule } from "./infrastructure/composition/rate-limit.module";


const app = express();


app.use(
    helmet(),
);


app.use(
    requestIdMiddleware,
);


app.use(
    requestContextMiddleware,
);


app.use(
    requestMetricsMiddleware,
);


app.use(
    rateLimitModule.apiRateLimiter,
);


app.use(
    express.json({
        limit:
            "1mb",
    }),
);


app.use(
    express.urlencoded({
        extended:
            false,

        limit:
            "1mb",
    }),
);


app.use(
    cookieParser(),
);


app.use(
    requestLogger,
);


app.use(
    "/",
    routes,
);


app.use(
    errorHandler,
);


export default app;
