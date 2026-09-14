import { Response } from "express";

import { authModule } from "../../infrastructure/composition/auth.module";
import { authorizationModule } from "../../infrastructure/composition/authorization.module";

import { AuthRequest } from "../../middleware/auth.middleware";
import { RequestWithId } from "../../middleware/request-id.middleware";
import { UpdateMyPersonalDetailsCommand } from "../../application/commands/update-my-personal-details.command";
import { UpdateMyAthleteGoalsCommand } from "../../application/commands/update-my-athlete-goals.command";

import {
    REFRESH_TOKEN_COOKIE_NAME,
    refreshTokenCookieOptions,
    refreshTokenClearCookieOptions,
} from "../../config/refresh-token-cookie.config";


export class AuthController {

    async updateMyGoals(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {
        res.set("Cache-Control", "no-store");

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const body = req.body as Record<string, unknown>;
        const allowedFields = new Set([
            "primaryGoal",
            "secondaryGoals",
        ]);

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body) ||
            Object.keys(body).some(
                (field) => !allowedFields.has(field),
            ) ||
            typeof body.primaryGoal !== "string" ||
            !Array.isArray(body.secondaryGoals)
        ) {
            res.status(400).json({
                error: "Invalid athlete-goals payload.",
            });
            return;
        }

        const result = await authModule
            .updateMyAthleteGoalsUseCase
            .execute(
                new UpdateMyAthleteGoalsCommand(
                    authUser.userId,
                    authUser.tenantId,
                    body.primaryGoal,
                    body.secondaryGoals,
                ),
            );

        if (!result.isSuccess) {
            res.status(400).json({ error: result.error });
            return;
        }

        res.status(200).json(result.value);
    }


    async login(
        req: RequestWithId,
        res: Response,
    ): Promise<void> {

        const result =
            await authModule.loginUseCase.execute({

                tenantId:
                    req.body.tenantId,

                email:
                    req.body.email,

                password:
                    req.body.password,

                ipAddress:
                    req.ip,

                userAgent:
                    req.get("User-Agent") ?? undefined,

                requestId:
                    req.requestId,

            });


        res.cookie(
            REFRESH_TOKEN_COOKIE_NAME,
            result.refreshToken,
            refreshTokenCookieOptions,
        );


        res.status(200).json({

            success: true,

            data: {

                user:
                    result.user,

                accessToken:
                    result.accessToken,

            },

        });

    }



    async refresh(
        req: RequestWithId,
        res: Response,
    ): Promise<void> {

        const refreshToken =
            req.cookies?.[
                REFRESH_TOKEN_COOKIE_NAME
            ];


        if (!refreshToken) {

            res.status(401).json({

                success: false,

                message: "Refresh token required",

            });

            return;

        }


        const result =
            await authModule.refreshTokenUseCase.execute({

                refreshToken,

                ipAddress:
                    req.ip,

                userAgent:
                    req.get("User-Agent") ?? undefined,

                requestId:
                    req.requestId,

            });


        res.cookie(
            REFRESH_TOKEN_COOKIE_NAME,
            result.refreshToken,
            refreshTokenCookieOptions,
        );


        res.status(200).json({

            success: true,

            data: {

                accessToken:
                    result.accessToken,

            },

        });

    }



    async logout(
        req: AuthRequest & RequestWithId,
        res: Response,
    ): Promise<void> {

        const refreshToken =
            req.cookies?.[
                REFRESH_TOKEN_COOKIE_NAME
            ];


        if (!refreshToken) {

            res.status(401).json({

                success: false,

                message: "Refresh token required",

            });

            return;

        }


        await authModule.logoutUseCase.execute({

            refreshToken,

            userId:
                req.user!.userId,

            tenantId:
                req.user!.tenantId,

            ipAddress:
                req.ip,

            userAgent:
                req.get("User-Agent") ?? undefined,

            requestId:
                req.requestId,

        });


        res.clearCookie(
            REFRESH_TOKEN_COOKIE_NAME,
            refreshTokenClearCookieOptions,
        );


        res.status(200).json({

            success: true,

            message: "Logged out successfully",

        });

    }



    async updateMe(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        res.set("Cache-Control", "no-store");

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const body =
            req.body as Record<string, unknown>;

        const forbiddenFields = [
            "tenantId",
            "organisationId",
            "selectedUserType",
            "roles",
            "status",
            "password",
        ];

        if (
            !body ||
            typeof body !== "object" ||
            forbiddenFields.some(
                (field) =>
                    Object.prototype.hasOwnProperty.call(
                        body,
                        field,
                    ),
            )
        ) {
            res.status(400).json({
                error:
                    "Invalid personal-details payload.",
            });
            return;
        }

        if (
            typeof body.firstName !== "string" ||
            typeof body.lastName !== "string" ||
            typeof body.email !== "string" ||
            (
                body.contactNumber !== null &&
                typeof body.contactNumber !== "string"
            ) ||
            typeof body.countryCode !== "string" ||
            (
                body.dateOfBirth !== null &&
                typeof body.dateOfBirth !== "string"
            )
        ) {
            res.status(400).json({
                error:
                    "Invalid personal-details payload.",
            });
            return;
        }

        let dateOfBirth: Date | null = null;

        if (body.dateOfBirth !== null) {
            dateOfBirth =
                new Date(body.dateOfBirth);

            if (
                Number.isNaN(
                    dateOfBirth.getTime(),
                )
            ) {
                res.status(400).json({
                    error:
                        "Date of birth is invalid.",
                });
                return;
            }
        }

        const result =
            await authModule
                .updateMyPersonalDetailsUseCase
                .execute(
                    new UpdateMyPersonalDetailsCommand(
                        authUser.userId,
                        authUser.tenantId,
                        body.firstName,
                        body.lastName,
                        body.email,
                        body.contactNumber,
                        body.countryCode,
                        dateOfBirth,
                    ),
                );

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(
            result.value,
        );
    }

    async me(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        res.set("Cache-Control", "no-store");

        const authUser = req.user;

        if (!authUser) {
            res.status(401).json({
                error: "Unauthorized",
            });
            return;
        }

        const permissions =
            await authorizationModule
                .permissionResolutionService
                .getUserPermissions(
                    authUser.userId,
                    authUser.tenantId,
                );

        res.status(200).json({

            userId:
                authUser.userId,

            tenantId:
                authUser.tenantId,

            roles:
                authUser.roles,

            permissions,

        });

    }

}


