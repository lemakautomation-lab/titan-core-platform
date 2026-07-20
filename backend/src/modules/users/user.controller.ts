import { Request, Response } from "express";
import { userService } from "./user.service";

export class UserController {
  async getUserById(req: Request, res: Response): Promise<void> {
    const id = String(req.params.id);

    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  }

  async getUserByEmail(req: Request, res: Response): Promise<void> {
    const email = String(req.params.email);

    const user = await userService.getUserByEmail(email);

    res.json({
      success: true,
      data: user,
    });
  }
}

export const userController = new UserController();