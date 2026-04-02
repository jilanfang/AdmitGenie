const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com";

export type OpenAIAdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

export async function classifyInput(args: {
  model: string;
  input: string;
}): Promise<OpenAIAdapterResult<unknown>> {
  return requestStructuredJson(args.model, args.input);
}

export async function generateCoachResponse(args: {
  model: string;
  input: string;
}): Promise<OpenAIAdapterResult<unknown>> {
  return requestStructuredJson(args.model, args.input);
}

export function healthcheck() {
  return {
    provider: "openai",
    configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    routingEnabled: process.env.OPENAI_ROUTING_ENABLED === "true",
  };
}

async function requestStructuredJson(
  model: string,
  input: string,
): Promise<OpenAIAdapterResult<unknown>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseUrl = getOpenAIBaseUrl();

  if (!apiKey) {
    return { ok: false, reason: "adapter_missing_api_key" };
  }

  try {
    const response = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, reason: `adapter_http_${response.status}` };
    }

    const payload = (await response.json()) as { output_text?: unknown };
    const parsed = parseJsonText(payload.output_text);

    if (parsed === null) {
      return { ok: false, reason: "adapter_invalid_json" };
    }

    return { ok: true, value: parsed };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { ok: false, reason: "adapter_timeout" };
    }

    return { ok: false, reason: "adapter_network_error" };
  }
}

function getOpenAIBaseUrl() {
  return process.env.OPENAI_BASE_URL?.trim().replace(/\/+$/, "") || DEFAULT_OPENAI_BASE_URL;
}

function parseJsonText(value: unknown): unknown {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
