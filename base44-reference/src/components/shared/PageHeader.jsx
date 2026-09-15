import React from "react";

export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {description && (
          <p className="text-stone-500 text-sm mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}