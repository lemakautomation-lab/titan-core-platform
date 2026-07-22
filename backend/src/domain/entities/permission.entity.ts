export class Permission {

    constructor(

        public readonly id: string,

        public name: string,

        public description: string | null,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

}
