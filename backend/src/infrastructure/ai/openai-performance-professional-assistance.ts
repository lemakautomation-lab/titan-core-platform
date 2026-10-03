import {
    PerformanceProfessionalAiUnavailableError,
    validatePerformanceProfessionalAiAssistance,
    type PerformanceProfessionalAiFacts,
    type PerformanceProfessionalAiProvider,
} from "../../application/ai-performance-professional/performance-professional-assistance";

const instructions =
    "You provide conservative decision support to an authorised Performance Professional. " +
    "Use only the supplied bounded TITAN facts. " +
    "The facts are limited historical snapshots and do not prove readiness, causation or future performance. " +
    "Identify factual observations and cautious considerations only. " +
    "Do not diagnose, prescribe, recommend medication or supplements, infer health conditions, or provide clinical advice. " +
    "Do not instruct changes to training load, workout programmes, Athlete records or professional plans. " +
    "The human Performance Professional remains the decision authority. " +
    "Do not invent measurements, facts, links or external information. " +
    "No tools. Return one concise summary, one to five observations, and one to five considerations.";

export class OpenAiPerformanceProfessionalAssistance
    implements PerformanceProfessionalAiProvider {
    constructor(
        private readonly configuration:
            Readonly<{
                enabled: boolean;
                apiKey?: string;
                model: string;
            }>,
        private readonly send:
            typeof fetch = fetch,
    ) {}

    async generate(
        facts: PerformanceProfessionalAiFacts,
    ) {
        const {
            enabled,
            apiKey,
            model,
        } = this.configuration;

        if (
            !enabled ||
            !apiKey ||
            !/^gpt-[a-zA-Z0-9.-]+$/.test(model)
        ) {
            throw new PerformanceProfessionalAiUnavailableError(
                "PROVIDER_FAILURE",
            );
        }

        let response: Response;

        try {
            response =
                await this.send(
                    "https://api.openai.com/v1/responses",
                    {
                        method: "POST",
                        redirect: "error",
                        signal:
                            AbortSignal.timeout(
                                20_000,
                            ),
                        headers: {
                            Authorization:
                                `Bearer ${apiKey}`,
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            model,
                            store: false,
                            max_output_tokens: 900,
                            instructions,
                            input:
                                JSON.stringify(facts),
                            tools: [],
                            text: {
                                format: {
                                    type: "json_schema",
                                    name:
                                        "performance_professional_assistance",
                                    strict: true,
                                    schema: {
                                        type: "object",
                                        additionalProperties:
                                            false,
                                        required: [
                                            "summary",
                                            "observations",
                                            "considerations",
                                        ],
                                        properties: {
                                            summary: {
                                                type:
                                                    "string",
                                            },
                                            observations: {
                                                type:
                                                    "array",
                                                minItems: 1,
                                                maxItems: 5,
                                                items: {
                                                    type:
                                                        "string",
                                                },
                                            },
                                            considerations: {
                                                type:
                                                    "array",
                                                minItems: 1,
                                                maxItems: 5,
                                                items: {
                                                    type:
                                                        "string",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        }),
                    },
                );
        }
        catch {
            throw new PerformanceProfessionalAiUnavailableError(
                "PROVIDER_FAILURE",
            );
        }

        if (!response.ok) {
            throw new PerformanceProfessionalAiUnavailableError(
                "PROVIDER_FAILURE",
            );
        }

        let text: string;

        try {
            text =
                await response.text();
        }
        catch {
            throw new PerformanceProfessionalAiUnavailableError(
                "PROVIDER_FAILURE",
            );
        }

        if (text.length > 32_000) {
            throw new PerformanceProfessionalAiUnavailableError(
                "INVALID_OUTPUT",
            );
        }

        try {
            const envelope: unknown =
                JSON.parse(text);

            if (
                !envelope ||
                typeof envelope !== "object"
            ) {
                throw new PerformanceProfessionalAiUnavailableError(
                    "INVALID_OUTPUT",
                );
            }

            const result =
                envelope as {
                    status?: unknown;
                    output?: unknown;
                };

            if (
                result.status !== "completed" ||
                !Array.isArray(result.output)
            ) {
                throw new PerformanceProfessionalAiUnavailableError(
                    "INVALID_OUTPUT",
                );
            }

            const outputs: string[] = [];

            for (const item of result.output) {
                if (
                    !item ||
                    typeof item !== "object"
                ) {
                    throw new PerformanceProfessionalAiUnavailableError(
                        "INVALID_OUTPUT",
                    );
                }

                const message =
                    item as {
                        type?: unknown;
                        content?: unknown;
                    };

                if (
                    message.type !== "message" ||
                    !Array.isArray(
                        message.content,
                    )
                ) {
                    throw new PerformanceProfessionalAiUnavailableError(
                        "INVALID_OUTPUT",
                    );
                }

                for (
                    const part
                    of message.content
                ) {
                    if (
                        !part ||
                        typeof part !== "object"
                    ) {
                        throw new PerformanceProfessionalAiUnavailableError(
                            "INVALID_OUTPUT",
                        );
                    }

                    const output =
                        part as {
                            type?: unknown;
                            text?: unknown;
                        };

                    if (
                        output.type !==
                            "output_text" ||
                        typeof output.text !==
                            "string"
                    ) {
                        throw new PerformanceProfessionalAiUnavailableError(
                            "INVALID_OUTPUT",
                        );
                    }

                    outputs.push(
                        output.text,
                    );
                }
            }

            if (outputs.length !== 1) {
                throw new PerformanceProfessionalAiUnavailableError(
                    "INVALID_OUTPUT",
                );
            }

            return validatePerformanceProfessionalAiAssistance(
                JSON.parse(outputs[0]),
            );
        }
        catch (error) {
            if (
                error instanceof
                PerformanceProfessionalAiUnavailableError
            ) {
                throw error;
            }

            throw new PerformanceProfessionalAiUnavailableError(
                "INVALID_OUTPUT",
            );
        }
    }
}
