import { HttpException } from "../../shared/exceptions/http.exception";

const KNOWN_ERRORS: Readonly<Record<string, readonly [number, string, string]>> =
    Object.freeze({
        "Generation input is unavailable.": [
            404,
            "GENERATION_INPUT_UNAVAILABLE",
            "Generation input is unavailable.",
        ],
        "No prescription-ready Exercises are available.": [
            422,
            "PROGRAMME_GENERATION_UNSATISFIABLE",
            "Programme generation constraints are unsatisfiable.",
        ],
        "No prescription-ready Exercise fits the session duration.": [
            422,
            "PROGRAMME_GENERATION_UNSATISFIABLE",
            "Programme generation constraints are unsatisfiable.",
        ],
        "Generated session is unsatisfiable.": [
            422,
            "PROGRAMME_GENERATION_UNSATISFIABLE",
            "Programme generation constraints are unsatisfiable.",
        ],
        "Idempotency key conflict.": [
            409,
            "IDEMPOTENCY_CONFLICT",
            "Idempotency key conflicts with an existing request.",
        ],
        "Generation candidates changed during transaction.": [
            409,
            "GENERATION_INPUT_CHANGED",
            "Generation inputs changed during processing.",
        ],
        "Generated Programme fingerprint changed.": [
            409,
            "GENERATION_INPUT_CHANGED",
            "Generation inputs changed during processing.",
        ],
    });

export class ProgrammeGenerationHttpErrorMapper {
    static map(error: unknown): HttpException | null {
        if (error instanceof HttpException) {
            return error;
        }
        if (!(error instanceof Error)) {
            return null;
        }

        const known = KNOWN_ERRORS[error.message];
        if (known) {
            return new HttpException(known[2], known[0], known[1]);
        }

        if (
            typeof (error as Error & { code?: unknown }).code === "string" &&
            (error as Error & { code?: string }).code === "P2034"
        ) {
            return new HttpException(
                "Programme generation is temporarily unavailable.",
                503,
                "GENERATION_TEMPORARILY_UNAVAILABLE",
            );
        }

        return null;
    }
}
