import { Request, Response, NextFunction } from "express";

export class TenantController {

    async create(
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {

        try {

            res.status(501).json({
                message: "CreateTenantUseCase not implemented yet.",
            });

        } catch (error) {

            next(error);

        }

    }

}