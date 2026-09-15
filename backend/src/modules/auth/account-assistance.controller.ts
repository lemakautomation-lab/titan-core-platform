import {
    Request,
    Response,
} from "express";

import {
    authModule,
} from "../../infrastructure/composition/auth.module";

export class AccountAssistanceController {
    async request(
        req: Request,
        res: Response,
    ): Promise<void> {
        res.set(
            "Cache-Control",
            "no-store",
        );

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body) ||
            Object.keys(req.body).length !== 0
        ) {
            res.status(400).json({
                message:
                    "Account-assistance requests do not accept identity or authority fields.",
            });
            return;
        }

        const result =
            await authModule
                .requestAccountAssistanceUseCase
                .execute();

        if (!result.isSuccess) {
            res.status(503).json({
                message:
                    result.error,
            });
            return;
        }

        res.status(201).json({
            data:
                result.value,
        });
    }
}

export const accountAssistanceController =
    new AccountAssistanceController();
