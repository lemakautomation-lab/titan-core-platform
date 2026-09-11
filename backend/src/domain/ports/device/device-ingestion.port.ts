export interface DeviceIngestionPort<TPayload, TResult> {
    ingest(
        deviceId: string,
        payload: TPayload,
    ): Promise<TResult>;
}
