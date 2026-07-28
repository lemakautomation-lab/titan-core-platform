import { HttpException } from "./http.exception";

export class ForbiddenException extends HttpException {

    constructor(

        message = "Forbidden",

    ) {

        super(message, 403);

    }

}
