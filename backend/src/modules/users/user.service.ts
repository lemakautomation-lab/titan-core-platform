import { User } from "./user.model";

export class UserService {
  async getUserById(id: string): Promise<User | null> {
    console.log(`Looking up user with ID: ${id}`);

    return null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log(`Looking up user with email: ${email}`);

    return null;
  }
}

export const userService = new UserService();