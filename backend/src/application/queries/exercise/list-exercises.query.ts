export class ListExercisesQuery {

    constructor(
        public readonly tenantId: string,
        public readonly page: number = 1,
        public readonly pageSize: number = 25,
    ) {}
}
