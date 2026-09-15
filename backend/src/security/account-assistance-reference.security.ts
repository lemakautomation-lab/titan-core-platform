import {
    createHash,
    randomBytes,
} from "node:crypto";

export interface GeneratedAccountAssistanceReference {
    rawReference: string;
    referenceHash: string;
}

export function hashAccountAssistanceReference(
    rawReference: string,
): string {
    if (
        typeof rawReference !== "string" ||
        !/^[A-Za-z0-9_-]{22}$/.test(
            rawReference,
        )
    ) {
        throw new Error(
            "Account-assistance reference is invalid.",
        );
    }

    return createHash("sha256")
        .update(rawReference, "utf8")
        .digest("hex");
}

export function generateAccountAssistanceReference():
GeneratedAccountAssistanceReference {
    const rawReference =
        randomBytes(16).toString("base64url");

    return Object.freeze({
        rawReference,
        referenceHash:
            hashAccountAssistanceReference(
                rawReference,
            ),
    });
}
