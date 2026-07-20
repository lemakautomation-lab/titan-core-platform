export class AuthService {

    async login(email: string, password: string) {

        return {
            message: "Authentication service placeholder",
            email,
            authenticated: false
        };

    }

}