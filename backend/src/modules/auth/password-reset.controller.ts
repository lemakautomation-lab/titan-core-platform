import {
    Request,
    Response,
} from "express";

import {
    CompletePasswordResetCommand,
} from "../../application/commands/complete-password-reset.command";
import {
    RequestPasswordResetCommand,
} from "../../application/commands/request-password-reset.command";
import {
    authModule,
} from "../../infrastructure/composition/auth.module";

function hasExactFields(
    value: unknown,
    allowedFields: readonly string[],
): value is Record<string, unknown> {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return false;
    }

    const fields =
        Object.keys(value);

    return (
        fields.length ===
            allowedFields.length &&
        fields.every(
            (field) =>
                allowedFields.includes(field),
        )
    );
}

export class PasswordResetController {
    async request(
        req: Request,
        res: Response,
    ): Promise<void> {
        res.set(
            "Cache-Control",
            "no-store",
        );

        if (
            !hasExactFields(
                req.body,
                ["email"],
            ) ||
            typeof req.body.email !== "string"
        ) {
            res.status(400).json({
                message:
                    "Invalid password-reset request.",
            });
            return;
        }

        const result =
            await authModule
                .requestPasswordResetUseCase
                .execute(
                    new RequestPasswordResetCommand(
                        req.body.email,
                    ),
                );

        res.status(202).json({
            message:
                result.value,
        });
    }

    async complete(
        req: Request,
        res: Response,
    ): Promise<void> {
        res.set(
            "Cache-Control",
            "no-store",
        );

        if (
            !hasExactFields(
                req.body,
                [
                    "token",
                    "newPassword",
                ],
            ) ||
            typeof req.body.token !== "string" ||
            typeof req.body.newPassword !== "string"
        ) {
            res.status(400).json({
                message:
                    "Invalid password-reset completion.",
            });
            return;
        }

        const result =
            await authModule
                .completePasswordResetUseCase
                .execute(
                    new CompletePasswordResetCommand(
                        req.body.token,
                        req.body.newPassword,
                    ),
                );

        if (!result.isSuccess) {
            res.status(400).json({
                message:
                    result.error,
            });
            return;
        }

        res.status(200).json({
            message:
                "Password reset completed.",
        });
    }
}

export const passwordResetController =
    new PasswordResetController();
