import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef(function Switch(
  {
    id,
    checked,
    onCheckedChange,
    label,
    ariaLabel,
    disabled = false,
    className = "",
    ...props
  },
  ref
) {
  const switchElement = (
    <SwitchPrimitives.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel || label || props["aria-label"]}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200",
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );

  if (label) {
    return (
      <div className={cn("inline-flex items-center gap-2", disabled && "opacity-50")}>
        {switchElement}
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 cursor-pointer select-none"
        >
          {label}
        </label>
      </div>
    );
  }

  return switchElement;
});

Switch.displayName = SwitchPrimitives.Root.displayName;

export default Switch;
