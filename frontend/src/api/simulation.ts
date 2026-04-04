const API_URL = "http://127.0.0.1:8001";

export interface SimParams {
  scanner_count: number;
  flight_count: number;
  arrival_rate: number;
  sim_duration: number;
}

export interface TimelinePoint {
  time: number;
  queue: number;
  processed: number;
}

export interface SimResult {
  total_bags: number;
  processed_bags: number;
  delayed_bags: number;
  avg_wait_minutes: number;
  max_wait_minutes: number;
  avg_total_minutes: number;
  max_total_minutes: number;
  scanner_utilization: number;
  delay_rate: number;
  throughput_per_hour: number;
  timeline: TimelinePoint[];
}

export interface ProgressEvent {
  type: "progress";
  step: number;
  total_steps: number;
  sim_time: number;
  sim_duration: number;
  progress: number;
  queue: number;
  processed: number;
  total_bags: number;
  delayed: number;
  avg_wait: number;
  utilization: number;
}

export type StreamEvent =
  | ProgressEvent
  | { type: "complete"; result: SimResult }
  | { type: "error"; message: string };

/**
 * Fetch SSE stream, çağrıya göre callback'leri tetikler.
 * Returns an AbortController so the caller can cancel.
 */
export function runSimulationStream(
  params: SimParams,
  onProgress: (e: ProgressEvent) => void,
  onComplete: (r: SimResult) => void,
  onError: (msg: string) => void
): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_URL}/simulate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;

          try {
            const event: StreamEvent = JSON.parse(json);
            if (event.type === "progress") onProgress(event);
            else if (event.type === "complete") onComplete(event.result);
            else if (event.type === "error") onError(event.message);
          } catch {
            // parse hatası — atla
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        onError((e as Error).message ?? "Bilinmeyen hata");
      }
    }
  })();

  return controller;
}
