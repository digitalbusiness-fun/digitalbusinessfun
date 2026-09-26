const RUN_ID = "X-Lovable-AIG-Run-ID";

export function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(RUN_ID)?.trim() || undefined;
      return response;
    },
  };
}

export function withRunIdHeader(response: Response, getRunId: () => string | undefined) {
  const headers = new Headers(response.headers);
  const id = getRunId();
  if (id) headers.set(RUN_ID, id);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function incomingRunId(request: Request) {
  return request.headers.get(RUN_ID)?.trim() || undefined;
}
