import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UsersRepository } from "../repositories/users.repository";
import { HttpException } from "../../../shared/exceptions/http.exception";

export class UsersService {

    private repository = new UsersRepository();

    getUsers() {
        return this.repository.findAll();
    }

    getUser(id: string) {
        return this.repository.findById(id);
    }

    createUser(dto: CreateUserDto) {

        if (this.repository.findByEmail(dto.email)) {

            throw new HttpException(
                "Email already exists",
                409,
                "CONFLICT",
            );

        }

        return this.repository.create(dto);
    }

    updateUser(
        id: string,
        dto: UpdateUserDto
    ) {
        return this.repository.update(id, dto);
    }

    deleteUser(id: string) {
        return this.repository.delete(id);
    }

}
