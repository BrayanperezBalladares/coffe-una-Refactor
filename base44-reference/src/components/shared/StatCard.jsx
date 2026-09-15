import React from "react";

export default function StatCard({ label, value, icon: Icon, color = "amber", subtitle }) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    stone: "bg-stone-50 text-stone-700 border-stone-100",
  };

  const iconColorMap = {
    amber: "bg-amber-100 text-amber-600",
    green: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    stone: "bg-stone-100 text-stone-600",
  };

  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}