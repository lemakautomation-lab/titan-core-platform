export class GetExerciseByIdQuery {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
    ) {}
}
