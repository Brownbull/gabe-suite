import { useState } from "react";

import { isApiError } from "../lib/api/errors";
import { useCompleteSetup } from "../lib/useCompleteSetup";
import { useMe } from "../lib/useMe";
import { useSaveSettings } from "../lib/useSaveSettings";

function validate(body: unknown): void {
  if (body == null) {
    throw new Error("empty");
  }
}

function setupErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 409) return "setup in progress";
    if (error.status === 418) return "teapot";
    if (error.detail === "consent required") return "consent";
    if (error.code === "no_such_code") return "unknown code";
  }
  return "save failed";
}

function conflictMessage(error: unknown): string {
  if (isApiError(error) && error.status === 409) {
    return error.detail ?? "conflict";
  }
  return "failed";
}

function ErrorBody({ error }: { error: unknown }) {
  if (isApiError(error) && error.code === "setup_locked") {
    return <p>locked</p>;
  }
  return null;
}

const apiClient = { PATCH: async (_path: string, _body: unknown) => ({ response: new Response() }) };

async function loadMe(): Promise<string> {
  const res = await fetch("/api/v1/me");
  if (res.status === 401) return "signed out";
  return "ok";
}

async function saveSettings(body: unknown): Promise<string> {
  const { response } = await apiClient.PATCH("/api/v1/settings", body);
  if (response.status === 422) return "invalid";
  if (response.status === 204) return "saved";
  return "unknown";
}

function useRetrySetup({ mutation }: { mutation: ReturnType<typeof useCompleteSetup> }) {
  return (body: unknown) => mutation.mutate(body, { onError: (error) => conflictMessage(error) });
}

export function SetupForm({ redo }: { redo: boolean }) {
  const complete = useCompleteSetup();
  const retry = useRetrySetup({ mutation: complete });
  const save = useSaveSettings();
  const me = useMe();
  const [mapError, setMapError] = useState<string | null>(null);
  const submit = (body: unknown) => {
    try {
      validate(body);
    } catch (error: unknown) {
      setMapError(setupErrorMessage(error));
      return;
    }
    complete.mutate(body, { onError: (error) => setMapError(conflictMessage(error)) });
  };
  const active = redo ? save : complete;
  const expired = isApiError(me.error) && me.error.status === 401;
  const text = mapError ?? (active.isError ? setupErrorMessage(active.error) : null);
  return (
    <form onSubmit={() => submit({})}>
      {expired ? <p>expired</p> : null}
      <p>{text}</p>
      <ErrorBody error={complete.error} />
    </form>
  );
}
