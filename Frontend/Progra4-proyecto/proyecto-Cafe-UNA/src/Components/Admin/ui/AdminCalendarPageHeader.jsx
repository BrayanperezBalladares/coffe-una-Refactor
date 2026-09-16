import { CalendarDays, RefreshCw } from "lucide-react";
import { ST } from "../../T/ST";

export function AdminCalendarPageHeader({ title, subtitle, onRefresh, loading }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-6 text-slate-900" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            <ST>{title}</ST>
          </h1>
        </div>
        <p className="mt-1 max-w-3xl text-slate-600">
          <ST>{subtitle}</ST>
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 self-start"
      >
        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
        <ST>Actualizar datos</ST>
      </button>
    </div>
  );
}
