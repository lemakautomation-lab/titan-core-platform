import { User } from "../models/user.model";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";

export class UsersRepository {

    private users: User[] = [
        {
            id: "001",
            firstName: "System",
            lastName: "Administrator",
            email: "admin@titan.com",
            role: "admin",
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    findAll(): User[] {
        return this.users;
    }

    findById(id: string): User | undefined {
        return this.users.find(user => user.id === id);
    }

    findByEmail(email: string): User | undefined {
        return this.users.find(user => user.email === email);
    }

    create(dto: CreateUserDto): User {

        const user: User = {
            id: Date.now().toString(),
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            role: dto.role,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.users.push(user);

        return user;
    }

    update(
        id: string,
        dto: UpdateUserDto
    ): User | null {

        const user = this.findById(id);

        if (!user) {
            return null;
        }

        Object.assign(user, dto);

        user.updatedAt = new Date();

        return user;
    }

    delete(id: string): boolean {

        const index = this.users.findIndex(
            user => user.id === id
        );

        if (index === -1) {
            return false;
        }

        this.users.splice(index, 1);

        return true;
    }

}