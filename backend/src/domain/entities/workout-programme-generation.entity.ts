import { randomUUID } from "crypto";

export type ImmutableJsonValue =
    | string
    | number
    | boolean
    | null
    | readonly ImmutableJsonValue[]
    | { readonly [key: string]: ImmutableJsonValue };

export interface WorkoutProgrammeGenerationProperties {
    tenantId: unknown;
    programmeId: unknown;
    actorUserId: unknown;
    idempotencyKey: unknown;
    requestFingerprint: unknown;
    requestFingerprintVersion: unknown;
    planFingerprint: unknown;
    rulesetId: unknown;
    rulesetVersion: unknown;
    inputSnapshot: unknown;
    planSnapshot: unknown;
}

export class WorkoutProgrammeGeneration {
    private constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly programmeId: string,
        public readonly actorUserId: string,
        public readonly idempotencyKey: string,
        public readonly requestFingerprint: string,
        public readonly requestFingerprintVersion: "1",
        public readonly planFingerprint: string,
        public readonly rulesetId: string,
        public readonly rulesetVersion: string,
        public readonly inputSnapshot: ImmutableJsonValue,
        public readonly planSnapshot: ImmutableJsonValue,
        private readonly createdAtValue: number,
    ) {
        Object.freeze(this);
    }

    static create(
        properties: WorkoutProgrammeGenerationProperties,
    ): WorkoutProgrammeGeneration {
        return this.restore(
            randomUUID(),
            properties.tenantId,
            properties.programmeId,
            properties.actorUserId,
            properties.idempotencyKey,
            properties.requestFingerprint,
            properties.requestFingerprintVersion,
            properties.planFingerprint,
            properties.rulesetId,
            properties.rulesetVersion,
            properties.inputSnapshot,
            properties.planSnapshot,
            new Date(),
        );
    }

    static restore(
        id: unknown,
        tenantId: unknown,
        programmeId: unknown,
        actorUserId: unknown,
        idempotencyKey: unknown,
        requestFingerprint: unknown,
        requestFingerprintVersion: unknown,
        planFingerprint: unknown,
        rulesetId: unknown,
        rulesetVersion: unknown,
        inputSnapshot: unknown,
        planSnapshot: unknown,
        createdAt: Date,
    ): WorkoutProgrammeGeneration {
        if (!(createdAt instanceof Date) || !Number.isFinite(createdAt.valueOf())) {
            throw new Error("Generation creation time is invalid.");
        }

        return new WorkoutProgrammeGeneration(
            this.requireIdentifier(id, "Generation ID"),
            this.requireIdentifier(tenantId, "Tenant ID"),
            this.requireIdentifier(programmeId, "Programme ID"),
            this.requireIdentifier(actorUserId, "Actor user ID"),
            this.requireIdempotencyKey(idempotencyKey),
            this.requireFingerprint(requestFingerprint, "Request fingerprint"),
            this.requireFingerprintVersion(requestFingerprintVersion),
            this.requireFingerprint(planFingerprint, "Plan fingerprint"),
            this.requireText(rulesetId, "Ruleset ID"),
            this.requireText(rulesetVersion, "Ruleset version"),
            this.cloneAndFreezeJsonObject(inputSnapshot, "Input snapshot"),
            this.cloneAndFreezeJsonObject(planSnapshot, "Plan snapshot"),
            createdAt.valueOf(),
        );
    }

    get createdAt(): Date {
        return new Date(this.createdAtValue);
    }

    private static requireIdentifier(value: unknown, field: string): string {
        const result = this.requireText(value, field);
        const semantic = result.toLocaleLowerCase("en-US");
        if (semantic === "null" || semantic === "undefined") {
            throw new Error(`${field} is required.`);
        }
        return result;
    }

    private static requireText(value: unknown, field: string): string {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${field} is required.`);
        }
        return value.trim();
    }

    private static requireIdempotencyKey(value: unknown): string {
        if (typeof value !== "string") {
            throw new Error("Idempotency key is invalid.");
        }
        const normalized = value.trim();
        if (
            normalized.length < 1 ||
            normalized.length > 200 ||
            !/^[A-Za-z0-9._:-]+$/u.test(normalized)
        ) {
            throw new Error("Idempotency key is invalid.");
        }
        return normalized;
    }

    private static requireFingerprint(value: unknown, field: string): string {
        if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) {
            throw new Error(`${field} is invalid.`);
        }
        return value;
    }

    private static requireFingerprintVersion(value: unknown): "1" {
        if (value !== "1") {
            throw new Error("Request fingerprint version is unsupported.");
        }
        return "1";
    }

    private static cloneAndFreezeJsonObject(
        value: unknown,
        field: string,
    ): ImmutableJsonValue {
        if (
            value === null ||
            typeof value !== "object" ||
            Array.isArray(value) ||
            Object.getPrototypeOf(value) !== Object.prototype
        ) {
            throw new Error(`${field} must be a JSON object.`);
        }
        return this.cloneAndFreezeJson(value, field);
    }

    private static cloneAndFreezeJson(
        value: unknown,
        field: string,
    ): ImmutableJsonValue {
        if (value === null || typeof value === "string" || typeof value === "boolean") {
            return value;
        }
        if (typeof value === "number") {
            if (!Number.isSafeInteger(value)) {
                throw new Error(`${field} contains an unsafe JSON number.`);
            }
            return value;
        }
        if (Array.isArray(value)) {
            return Object.freeze(value.map(item =>
                this.cloneAndFreezeJson(item, field),
            ));
        }
        if (
            typeof value === "object" &&
            value !== null &&
            Object.getPrototypeOf(value) === Object.prototype
        ) {
            const copy: Record<string, ImmutableJsonValue> = {};
            for (const key of Object.keys(value as Record<string, unknown>)) {
                copy[key] = this.cloneAndFreezeJson(
                    (value as Record<string, unknown>)[key],
                    field,
                );
            }
            return Object.freeze(copy);
        }
        throw new Error(`${field} is not JSON-compatible.`);
    }
}
