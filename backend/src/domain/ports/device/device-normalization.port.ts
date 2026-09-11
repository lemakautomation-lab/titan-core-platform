export interface DeviceNormalizationPort<TInput, TOutput> {
    normalize(
        input: TInput,
    ): Promise<TOutput>;
}
