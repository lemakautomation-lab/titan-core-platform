export class Role {

    constructor(

        public readonly id: string,

        public name: string,

        public description: string | null,

        public readonly createdAt: Date,

        public updatedAt: Date,

    ) {}

    rename(name: string): void {
        this.name = name;
    }

    updateDescription(description: string | null): void {
        this.description = description;
    }

}