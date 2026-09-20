import { useEffect } from "react";
import { NextResponse } from "next/server";

import { useMe } from "../lib/useMe";

// Slice 11e — the shapes the first reading got wrong on real apps (the review of the four dry-run feeds). Every comparison
// here reads a plain parameter, so no request is reached: the routing, the readers and the findings of Slice 11c stay put.
// Mounted nowhere, no button, no anchor, no <Navigate>.
type Failure = { status: number; detail?: string };

// grouped, and still the function's own answer: its callers decide
export const isAuthFailure = (f: Failure): boolean =>
  f instanceof Object && (f.status === 401 || f.status === 403);

export function SetupFailureEdges({ failure, onRetry, res }: { failure: Failure; onRetry: () => void; res: Response }) {
  const { error, refetch } = useMe();
  // picks a value and opens no branch — the identical `if` inside the effect owns its own rows
  const ended = !error && failure.status === 403;

  useEffect(() => {
    if (failure.status === 403) {
      onRetry();
    }
  }, [failure, onRetry]);

  const onFail = async () => {
    if (failure.status === 503) {
      refetch(); // another request's refetch: a refresh (the battery swaps the receiver to `error` to read the retry)
    }
    if (failure.status === 409) {
      return new Response("");
    }
    if (failure.status === 410) {
      return NextResponse.redirect(
        new URL("/auth/create-account", "http://localhost")
      );
    }
    if (failure.status === 502) {
      await res
        .json()
        .catch(() => null);
      throw new Error("the setup could not be completed and the server said nothing useful about the reason why");
    }
    return null;
  };

  return <p data-ended={String(ended)} onMouseEnter={() => void onFail()} />;
}
