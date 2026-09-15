import { usePrefsStore } from "../store/prefs";
import { useSessionStore } from "../store/session";

export function PrefsPanel() {
  const setTheme = usePrefsStore((s) => s.setTheme);
  const { remove, clear, toggle, saveTheme, resetAll, wipe, noop } = usePrefsStore();
  const signOut = useSessionStore((s) => s.signOut);
  usePrefsStore.getState().add("x");
  useSessionStore.getState().expire({ status: 401 });
  return (
    <button onClick={() => { setTheme("x"); remove("x"); clear(); toggle(); saveTheme("y"); signOut(); resetAll(); wipe(); noop(); }}>
      go
    </button>
  );
}
