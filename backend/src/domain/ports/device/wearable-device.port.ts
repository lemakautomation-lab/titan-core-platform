export interface WearableDevicePort<TDevice> {
    getDevice(
        deviceId: string,
    ): Promise<TDevice | null>;
}
