export const BODY_FAT_METHODS = [
    "BIOELECTRICAL_IMPEDANCE",
    "DEXA",
    "SKINFOLD_CALIPER",
    "CLINICAL_ASSESSMENT",
] as const;

export type BodyFatMethod = typeof BODY_FAT_METHODS[number];

export function isBodyFatMethod(value: unknown): value is BodyFatMethod {
    return BODY_FAT_METHODS.some((method) => method === value);
}
