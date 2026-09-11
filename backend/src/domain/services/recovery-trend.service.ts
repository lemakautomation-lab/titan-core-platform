import { RestTracking } from "../entities/rest-tracking.entity";

export type RecoveryTrendDirection =
    | "RISING"
    | "FALLING"
    | "STABLE";

export interface RecoveryTrendPoint {
    recordedAt: Date;
    value: number;
    direction: RecoveryTrendDirection;
}

export class RecoveryTrendService {
    static evaluate(
        observations: ReadonlyArray<RestTracking>,
    ): RecoveryTrendPoint[] {
        const ordered = [...observations].sort(
            (a, b) =>
                a.recordedAt.getTime() -
                b.recordedAt.getTime(),
        );

        return ordered.map((observation, index) => {
            if (index === 0) {
                return {
                    recordedAt: observation.recordedAt,
                    value: observation.value,
                    direction: "STABLE",
                };
            }

            const previous = ordered[index - 1];

            return {
                recordedAt: observation.recordedAt,
                value: observation.value,
                direction:
                    observation.value > previous.value
                        ? "RISING"
                        : observation.value < previous.value
                            ? "FALLING"
                            : "STABLE",
            };
        });
    }
}
