import type { FlowJson } from "@/types";

export interface ExecuteRequest {
  flow: FlowJson;
  input: string;
  variables?: Record<string, any>;
  session_id?: string;
}

export async function executeFlow(
  request: ExecuteRequest,
  onToken: (token: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
) {
  try {
    const response = await fetch("/execute/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      onToken(chunk);
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : String(error));
  }
}
