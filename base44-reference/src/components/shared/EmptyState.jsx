import React from "react";
import { Package } from "lucide-react";

export default function EmptyState({ icon: Icon = Package, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-700">{title}</h3>
      {description && <p className="text-sm text-stone-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}