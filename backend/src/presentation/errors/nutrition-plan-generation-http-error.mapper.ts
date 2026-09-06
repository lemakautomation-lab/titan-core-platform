import { HttpException } from "../../shared/exceptions/http.exception";

const KNOWN_ERRORS: Readonly<
    Record<string, readonly [number, string, string]>
> = Object.freeze({
    "Nutrition generation input is unavailable.": [
        404,
        "GENERATION_INPUT_UNAVAILABLE",
        "Nutrition generation input is unavailable.",
    ],
    "Idempotency key conflict.": [
        409,
        "IDEMPOTENCY_CONFLICT",
        "Idempotency key conflicts with an existing request.",
    ],
    "Generated nutrition plan invariant failure.": [
        500,
        "NUTRITION_GENERATION_INVARIANT_FAILURE",
        "Nutrition plan generation failed safely.",
    ],
});

export class NutritionPlanGenerationHttpErrorMapper {
    static map(error: unknown): HttpException | null {
        if (error instanceof HttpException) {
            return error;
        }

        if (!(error instanceof Error)) {
            return null;
        }

        const known = KNOWN_ERRORS[error.message];

        if (known) {
            return new HttpException(
                known[2],
                known[0],
                known[1],
            );
        }

        if (
            typeof (error as Error & { code?: unknown }).code === "string" &&
            (error as Error & { code?: string }).code === "P2034"
        ) {
            return new HttpException(
                "Nutrition generation is temporarily unavailable.",
                503,
                "GENERATION_TEMPORARILY_UNAVAILABLE",
            );
        }

        return null;
    }
}
