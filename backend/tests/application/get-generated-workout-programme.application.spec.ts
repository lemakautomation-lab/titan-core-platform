import crypto from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import {
    GeneratedWorkoutProgrammeReadModel,
    GeneratedWorkoutProgrammeReadRepository,
} from "../../src/application/ports/generated-workout-programme-read.repository";
import { GetGeneratedWorkoutProgrammeQuery } from "../../src/application/queries/workout-programme/get-generated-workout-programme.query";
import { GetGeneratedWorkoutProgrammeUseCase } from "../../src/application/use-cases/get-generated-workout-programme.use-case";

function repository(
    result: GeneratedWorkoutProgrammeReadModel | null,
): GeneratedWorkoutProgrammeReadRepository & {
    findCompleteByGenerationId: ReturnType<typeof vi.fn>;
} {
    return {
        findCompleteByGenerationId: vi.fn().mockResolvedValue(result),
    };
}

describe("Get generated Workout Programme application boundary", () => {
    it("trims and canonicalizes the generation ID and authoritative tenant", () => {
        const id = crypto.randomUUID();
        const query = new GetGeneratedWorkoutProgrammeQuery(
            `  ${id.toLocaleUpperCase("en-US")}  `,
            "  tenant-authority  ",
        );
        expect(query).toEqual({
            generationId: id,
            tenantId: "tenant-authority",
        });
        expect(Object.isFrozen(query)).toBe(true);
    });

    it.each(["", "not-a-uuid", "null", "undefined"])(
        "rejects invalid generation identity %j",
        value => {
            expect(() => new GetGeneratedWorkoutProgrammeQuery(
                value,
                "tenant-authority",
            )).toThrow();
        },
    );

    it("passes generation and tenant authority to exactly one read", async () => {
        const id = crypto.randomUUID();
        const expected = Object.freeze({
            generationId: id,
        }) as unknown as GeneratedWorkoutProgrammeReadModel;
        const readRepository = repository(expected);
        const useCase = new GetGeneratedWorkoutProgrammeUseCase(readRepository);

        const result = await useCase.execute(
            new GetGeneratedWorkoutProgrammeQuery(id, "tenant-authority"),
        );

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(expected);
        expect(readRepository.findCompleteByGenerationId).toHaveBeenCalledOnce();
        expect(readRepository.findCompleteByGenerationId).toHaveBeenCalledWith(
            id,
            "tenant-authority",
        );
    });

    it("returns the same generic missing result for an unavailable read", async () => {
        const readRepository = repository(null);
        const useCase = new GetGeneratedWorkoutProgrammeUseCase(readRepository);
        const result = await useCase.execute(
            new GetGeneratedWorkoutProgrammeQuery(
                crypto.randomUUID(),
                "tenant-authority",
            ),
        );
        expect(result.isSuccess).toBe(false);
        expect(result.error).toBe("Generated Workout Programme not found.");
    });

    it("propagates invariant and infrastructure failures without mutation handling", async () => {
        const failure = new Error("infrastructure detail");
        const readRepository = repository(null);
        readRepository.findCompleteByGenerationId.mockRejectedValueOnce(failure);
        const useCase = new GetGeneratedWorkoutProgrammeUseCase(readRepository);
        await expect(useCase.execute(
            new GetGeneratedWorkoutProgrammeQuery(
                crypto.randomUUID(),
                "tenant-authority",
            ),
        )).rejects.toBe(failure);
        expect(Object.keys(readRepository)).toEqual([
            "findCompleteByGenerationId",
        ]);
    });
});
