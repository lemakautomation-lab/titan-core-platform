export class HealthService {
    public getHealth() {
        return {
            application: "TITAN Core Platform",
            status: "online",
            version: "1.0.0",
            environment: process.env.NODE_ENV || "development"
        };
    }
}

export const healthService = new HealthService();