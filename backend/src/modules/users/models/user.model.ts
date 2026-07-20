export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}