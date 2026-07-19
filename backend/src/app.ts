import express from "express";


const app = express();


// Middleware
app.use(express.json());


// Health Check
app.get("/", (_req, res) => {
    res.json({
        application: "TITAN Core Platform",
        status: "online"
    });
});


export default app;