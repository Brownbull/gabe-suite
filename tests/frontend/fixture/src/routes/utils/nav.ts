import { fmtDate } from "../../lib/utils/format";
export function crumb(d: Date): string { return "recipes/" + fmtDate(d); }
