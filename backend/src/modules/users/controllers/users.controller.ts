import { Request, Response } from "express";
import { UsersService } from "../services/users.service";

export class UsersController {

    private service = new UsersService();

    getUsers = (req: Request, res: Response) => {
        return res.json({
            success: true,
            data: this.service.getUsers()
        });
    };

    getUser = (req: Request, res: Response) => {

        const user = this.service.getUser(req.params.id as string);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            data: user
        });

    };

    createUser = (req: Request, res: Response) => {

        try {

            const user = this.service.createUser(req.body);

            return res.status(201).json({
                success: true,
                data: user
            });

        } catch (error) {

            return res.status(400).json({
                success: false,
                message: (error as Error).message
            });

        }

    };

    updateUser = (req: Request, res: Response) => {

        const user = this.service.updateUser(
    req.params.id as string,
    req.body
);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            data: user
        });

    };

    deleteUser = (req: Request, res: Response) => {

        const deleted = this.service.deleteUser(
    req.params.id as string
);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            message: "User deleted successfully"
        });

    };

}