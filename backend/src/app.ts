import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

import routes from "./routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { requestContextMiddleware } from "./middleware/request-context.middleware";
import { requestMetricsMiddleware } from "./middleware/request-metrics.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";
import { rateLimitModule } from "./infrastructure/composition/rate-limit.module";
import { environmentConfig } from "./config/environment.config";


const app = express();


app.use(
    helmet(),
);


app.use(
    cors({

        origin:
            environmentConfig.corsAllowedOrigins,

        credentials:
            true,

        methods: [
            "GET",
            "HEAD",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Request-Id",
        ],

    }),
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
    (req, res) => {

        res.status(404).json({

            success: false,

            error: {
                code: "NOT_FOUND",
                message: "Route not found.",
            },

            timestamp:
                new Date().toISOString(),

            path:
                req.originalUrl,

        });

    },
);


app.use(
    errorHandler,
);


export default app;
