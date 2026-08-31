import { Router } from "express";

import { ProductController } from "../controllers/product.controller";

import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/authorization.middleware";

export function createProductRoutes(
    controller: ProductController,
): Router {

    const router = Router();

    router.use(authMiddleware);

    router.post(
        "/",
        requirePermission("products.create"),
        controller.create.bind(controller),
    );

    router.get(
        "/",
        requirePermission("products.read"),
        controller.list.bind(controller),
    );

    router.get(
        "/:id",
        requirePermission("products.read"),
        controller.getById.bind(controller),
    );

    router.put(
        "/:id",
        requirePermission("products.update"),
        controller.update.bind(controller),
    );

    router.delete(
        "/:id",
        requirePermission("products.delete"),
        controller.delete.bind(controller),
    );

    return router;
}
