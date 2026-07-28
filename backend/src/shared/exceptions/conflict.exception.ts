import { HttpException } from "./http.exception";

export class ConflictException extends HttpException {

    constructor(

        message = "Conflict",

    ) {

        super(message, 409);

    }

}
