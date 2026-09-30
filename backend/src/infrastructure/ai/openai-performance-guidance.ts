import {
    GuidanceUnavailableError, validateGuidance,
    type GuidanceFacts, type PerformanceGuidanceProvider,
} from "../../application/ai-athlete/performance-guidance";

const instructions = "You provide conservative general fitness performance support. "
    + "Use only the supplied authorised goal categories and existing programme frequencies. "
    + "These are limited snapshots, not evidence of progress or readiness. "
    + "Suggest tracking consistency and discussing goals with the athlete's coach. "
    + "Do not invent measurements, infer health conditions, diagnose, prescribe, recommend supplements, "
    + "or change training load, frequency or a professional plan. No tools or external links. "
    + "Return one concise summary and one to three low-risk practical actions in plain text.";

export class OpenAiPerformanceGuidance implements PerformanceGuidanceProvider {
    constructor(private readonly configuration: Readonly<{ enabled: boolean; apiKey?: string; model: string }>,
        private readonly send: typeof fetch = fetch) {}

    async generate(facts: GuidanceFacts) {
        const { enabled, apiKey, model } = this.configuration;
        if (!enabled || !apiKey || !/^gpt-[a-zA-Z0-9.-]+$/.test(model)) {
            throw new GuidanceUnavailableError("PROVIDER_FAILURE");
        }

        let response: Response;
        try {
            response = await this.send("https://api.openai.com/v1/responses", {
                method: "POST", redirect: "error", signal: AbortSignal.timeout(20_000),
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model, store: false, max_output_tokens: 700,
                    instructions, input: JSON.stringify(facts), tools: [],
                    text: { format: { type: "json_schema", name: "performance_guidance", strict: true,
                        schema: { type: "object", additionalProperties: false, required: ["summary", "actions"],
                            properties: { summary: { type: "string" }, actions: { type: "array", items: { type: "string" } } } } } },
                }),
            });
        } catch {
            throw new GuidanceUnavailableError("PROVIDER_FAILURE");
        }

        if (!response.ok) throw new GuidanceUnavailableError("PROVIDER_FAILURE");

        let text: string;
        try {
            text = await response.text();
        } catch {
            throw new GuidanceUnavailableError("PROVIDER_FAILURE");
        }
        if (text.length > 32_000) throw new GuidanceUnavailableError("INVALID_OUTPUT");

        try {
            const envelope: unknown = JSON.parse(text);
            if (!envelope || typeof envelope !== "object") throw new GuidanceUnavailableError("INVALID_OUTPUT");
            const result = envelope as { status?: unknown; output?: unknown };
            if (result.status !== "completed" || !Array.isArray(result.output)) throw new GuidanceUnavailableError("INVALID_OUTPUT");
            const outputs: string[] = [];
            for (const item of result.output) {
                if (!item || typeof item !== "object") throw new GuidanceUnavailableError("INVALID_OUTPUT");
                const message = item as { type?: unknown; content?: unknown };
                if (message.type !== "message" || !Array.isArray(message.content)) throw new GuidanceUnavailableError("INVALID_OUTPUT");
                for (const part of message.content) {
                    if (!part || typeof part !== "object") throw new GuidanceUnavailableError("INVALID_OUTPUT");
                    const output = part as { type?: unknown; text?: unknown };
                    if (output.type !== "output_text" || typeof output.text !== "string") throw new GuidanceUnavailableError("INVALID_OUTPUT");
                    outputs.push(output.text);
                }
            }
            if (outputs.length !== 1) throw new GuidanceUnavailableError("INVALID_OUTPUT");
            return validateGuidance(JSON.parse(outputs[0]));
        } catch (error) {
            if (error instanceof GuidanceUnavailableError) throw error;
            throw new GuidanceUnavailableError("INVALID_OUTPUT");
        }
    }
}
