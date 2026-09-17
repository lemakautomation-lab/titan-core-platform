import { Response } from "express";

import { authModule } from "../../infrastructure/composition/auth.module";
import { authorizationModule } from "../../infrastructure/composition/authorization.module";

import { AuthRequest } from "../../middleware/auth.middleware";
import { RequestWithId } from "../../middleware/request-id.middleware";
import { UpdateMyPersonalDetailsCommand } from "../../application/commands/update-my-personal-details.command";
import { UpdateMyAthleteGoalsCommand } from "../../application/commands/update-my-athlete-goals.command";
import { CreateMyAthleteBodyMeasurementCommand } from "../../application/commands/create-my-athlete-body-measurement.command";
import { UpdateMyAthleteBodyModelCommand } from "../../application/commands/update-my-athlete-body-model.command";import { RegisterAthleteCommand } from "../../application/commands/register-athlete.command";

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


    async createMyBodyMeasurement(
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

        const allowedFields = new Set([
            "heightCm",
            "weightKg",
            "bodyFatPercentage",
            "recordedAt",
        ]);

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body) ||
            Object.keys(body).some(
                (field) => !allowedFields.has(field),
            ) ||
            typeof body.heightCm !== "number" ||
            typeof body.weightKg !== "number" ||
            (
                body.bodyFatPercentage !== undefined &&
                body.bodyFatPercentage !== null &&
                typeof body.bodyFatPercentage !== "number"
            ) ||
            (
                body.recordedAt !== undefined &&
                typeof body.recordedAt !== "string"
            )
        ) {
            res.status(400).json({
                error:
                    "Invalid body-measurement payload.",
            });
            return;
        }

        const result =
            await authModule
                .createMyAthleteBodyMeasurementUseCase
                .execute(
                    new CreateMyAthleteBodyMeasurementCommand(
                        authUser.userId,
                        authUser.tenantId,
                        body.heightCm,
                        body.weightKg,
                        body.bodyFatPercentage,
                        body.recordedAt,
                    ),
                );

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(201).json(result.value);
    }

    async getMyOnboardingStatus(
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

        const result =
            await authModule
                .getMyAthleteOnboardingStatusUseCase
                .execute({
                    userId: authUser.userId,
                    tenantId: authUser.tenantId,
                });

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async updateMyBodyModel(
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

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body) ||
            Object.keys(body).length !== 1 ||
            !Object.prototype.hasOwnProperty.call(
                body,
                "modelType",
            ) ||
            typeof body.modelType !== "string"
        ) {
            res.status(400).json({
                error:
                    "Invalid performance-body model payload.",
            });
            return;
        }

        const result =
            await authModule
                .updateMyAthleteBodyModelUseCase
                .execute(
                    new UpdateMyAthleteBodyModelCommand(
                        authUser.userId,
                        authUser.tenantId,
                        body.modelType,
                    ),
                );

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }


    async getMyPerformanceBodyProfile(
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

        const result =
            await authModule
                .getMyAthletePerformanceBodyProfileUseCase
                .execute({
                    userId: authUser.userId,
                    tenantId: authUser.tenantId,
                });

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async getMyRelevantContext(
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

        const result =
            await authModule
                .getMyRelevantContextUseCase
                .execute({
                    userId: authUser.userId,
                    tenantId: authUser.tenantId,
                });

        if (!result.isSuccess) {
            res.status(400).json({
                error: result.error,
            });
            return;
        }

        res.status(200).json(result.value);
    }

    async registerAthlete(
        req: RequestWithId,
        res: Response,
    ): Promise<void> {
        res.set("Cache-Control", "no-store");

        const body =
            req.body as Record<string, unknown>;

        const allowedFields = new Set([
            "firstName",
            "lastName",
            "email",
            "password",
            "countryCode",
            "dateOfBirth",
        ]);

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body) ||
            Object.keys(body).some(
                (field) =>
                    !allowedFields.has(field),
            ) ||
            typeof body.firstName !== "string" ||
            typeof body.lastName !== "string" ||
            typeof body.email !== "string" ||
            typeof body.password !== "string" ||
            typeof body.countryCode !== "string" ||
            typeof body.dateOfBirth !== "string"
        ) {
            res.status(400).json({
                error:
                    "Invalid Athlete registration payload.",
            });
            return;
        }

        const dateOfBirth =
            new Date(body.dateOfBirth);

        if (
            Number.isNaN(
                dateOfBirth.getTime(),
            )
        ) {
            res.status(400).json({
                error:
                    "Athlete date of birth is invalid.",
            });
            return;
        }

        const result =
            await authModule
                .registerAthleteUseCase
                .execute(
                    new RegisterAthleteCommand(
                        body.firstName,
                        body.lastName,
                        body.email,
                        body.password,
                        body.countryCode,
                        dateOfBirth,
                    ),
                );

        if (!result.isSuccess) {
            res.status(
                result.error ===
                    "Email already exists for this tenant."
                    ? 409
                    : 400,
            ).json({
                error: result.error,
            });
            return;
        }

        if (!result.value) {
            res.status(500).json({
                error: "Athlete registration failed.",
            });
            return;
        }

        const loginResult =
            await authModule.loginUseCase.execute({
                tenantId:
                    result.value.tenantId,
                email:
                    result.value.email,
                password:
                    body.password,
                ipAddress:
                    req.ip,
                userAgent:
                    req.get("User-Agent") ??
                    undefined,
                requestId:
                    req.requestId,
            });

        res.cookie(
            REFRESH_TOKEN_COOKIE_NAME,
            loginResult.refreshToken,
            refreshTokenCookieOptions,
        );

        res.status(201).json({
            success: true,
            data: {
                user:
                    loginResult.user,
                accessToken:
                    loginResult.accessToken,
                registration:
                    result.value,
            },
        });
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


