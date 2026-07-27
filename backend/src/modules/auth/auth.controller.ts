import { Request, Response } from "express";

import { authModule } from "../../infrastructure/composition/auth.module";

import { AuthRequest } from "../../middleware/auth.middleware";


export class AuthController {


    async login(
        req: Request,
        res: Response,
    ): Promise<void> {


        const result =
            await authModule.loginUseCase.execute({

                tenantId: req.body.tenantId,

                email: req.body.email,

                password: req.body.password,

            });


        res.status(200).json({

            success: true,

            data: result,

        });


    }



    async refresh(
        req: Request,
        res: Response,
    ): Promise<void> {


        const result =
            await authModule.refreshTokenUseCase.execute({

                refreshToken:
                    req.body.refreshToken,

            });


        res.status(200).json({

            success: true,

            data: result,

        });


    }



    async logout(
        req: Request,
        res: Response,
    ): Promise<void> {


        await authModule.logoutUseCase.execute({

            sessionId:
                req.body.sessionId,

        });


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
