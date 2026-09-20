import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useCompleteSetup } from "../lib/useCompleteSetup";
import { useMe } from "../lib/useMe";

// Slice 11e — what a reason branch DOES: one branch per class the reading must recognise, each from a library binder or
// a library callee shape. Mounted nowhere, no button, no anchor, no <Navigate>: the guards, controls and router counts stay put.
const LOCKED = 423;

export function SetupFailure() {
  const complete = useCompleteSetup();
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useTranslations("setup");
  const [note, setNote] = useState<string | null>(null);

  const onFail = () => {
    if (complete.error?.status === 401) {
      navigate("/login");
      return;
    }
    if (complete.error?.status === LOCKED) {
      complete.mutate({});
    }
    if (complete.error?.status === 500) {
      toast.error(t("failed"));
      queryClient.invalidateQueries({ queryKey: ["me"] });
      me.refetch();
      setNote("failed");
      console.warn("setup failed");
      void fetch("/api/v1/me");
      setTimeout(() => setNote(null), 10);
      throw new Error("failed");
    }
  };

  return <p data-note={note ?? ""} onMouseEnter={onFail} />;
}
