import { Router } from "express";

import apiRoutes from "./api";
import v1Routes from "./v1";


const router = Router();


router.use(
    "/api",
    apiRoutes,
);


router.use(
    "/api/v1",
    v1Routes,
);


export default router;
