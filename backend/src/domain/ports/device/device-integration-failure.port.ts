export interface DeviceIntegrationFailure {
    code: string;
    message: string;
}

export interface DeviceIntegrationFailurePort {
    handleFailure(
        failure: DeviceIntegrationFailure,
    ): Promise<void>;
}
