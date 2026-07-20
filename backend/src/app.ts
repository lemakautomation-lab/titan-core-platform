import express from "express";
import routes from "./routes";
import { requestLogger } from "./middleware/request-logger.middleware";

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/", routes);

export default app;