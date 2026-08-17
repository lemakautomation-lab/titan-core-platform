import { Response } from "express";

import { authModule } from "../../infrastructure/composition/auth.module";

import { AuthRequest } from "../../middleware/auth.middleware";
import { RequestWithId } from "../../middleware/request-id.middleware";

import {
    REFRESH_TOKEN_COOKIE_NAME,
    refreshTokenCookieOptions,
    refreshTokenClearCookieOptions,
} from "../../config/refresh-token-cookie.config";


export class AuthController {


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

        await authModule.logoutUseCase.execute({

            sessionId:
                req.body.sessionId,

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



    async me(
        req: AuthRequest,
        res: Response,
    ): Promise<void> {

        res.status(200).json({

            userId:
                req.user!.userId,

            tenantId:
                req.user!.tenantId,

        });

    }

}
