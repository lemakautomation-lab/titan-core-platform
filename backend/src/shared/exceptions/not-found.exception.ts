import { HttpException } from "./http.exception";

export class NotFoundException extends HttpException {

    constructor(

        message = "Not Found",

    ) {

        super(message, 404);

    }

}
