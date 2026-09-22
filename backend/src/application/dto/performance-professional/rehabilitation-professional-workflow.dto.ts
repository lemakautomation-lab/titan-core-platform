export interface RehabilitationProfessionalWorkflowDto {
    athleteId: string;
    recovery: Array<{
        id: string;
        athleteId: string;
        value: unknown;
        recordedAt: string;
        createdAt: string;
        sourceType: string;
        sourceId: string;
        sourceObservationId: string;
    }>;
}
