import express from "express";
import routes from "./routes";
import { requestLogger } from "./middleware/request-logger.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/", routes);

// Global Error Handler
app.use(errorHandler);

export default app;