import express from "express";
import helmet from "helmet";

import routes from "./routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";


const app = express();


// Security Headers

app.use(

    helmet(),

);


// Request Body Protection

app.use(

    express.json({

        limit: "1mb",

    }),

);


app.use(

    express.urlencoded({

        extended: false,

        limit: "1mb",

    }),

);


// Request Logging

app.use(

    requestLogger,

);


// Routes

app.use(

    "/",

    routes,

);


// Global Error Handler

app.use(

    errorHandler,

);


export default app;
