import { HttpException } from "./http.exception";

import { ValidationError }
    from "../validation/validation-error";

export class ValidationException
    extends HttpException {

    constructor(

        public readonly errors: ValidationError[],

    ) {

        super(

            "Validation failed.",

            400,

        );

    }

}
