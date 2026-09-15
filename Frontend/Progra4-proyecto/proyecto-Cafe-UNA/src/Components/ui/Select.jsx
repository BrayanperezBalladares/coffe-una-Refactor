import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTraducir } from "../../hooks/useTraducir";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

function TextoOpcion({ texto }) {
  return useTraducir(texto || "");
}

function normalizarOpciones(options) {
  return (Array.isArray(options) ? options : []).map((opcion) => {
    if (opcion != null && typeof opcion === "object") {
      return {
        value: String(opcion.value ?? ""),
        label: opcion.label ?? String(opcion.value ?? ""),
        ...opcion,
      };
    }
    return { value: String(opcion ?? ""), label: String(opcion ?? "") };
  });
}

/**
 * Adapter component for existing UiSelect usages.
 * Fully compatible with legacy options array, while leveraging Radix / Tailwind styling.
 */
export function UiSelect({
  id,
  value,
  onChange,
  options = [],
  disabled = false,
  ariaLabel,
  className = "",
  footer = null,
  renderOptionEnd,
}) {
  const opciones = normalizarOpciones(options);
  const currentVal = value != null ? String(value) : "";
  const selectedOption = opciones.find((o) => o.value === currentVal) || opciones[0];

  // If custom option action or footer is needed, render with custom dropdown menu
  if (renderOptionEnd || footer) {
    return (
      <UiSelectAdvanced
        id={id}
        value={value}
        onChange={onChange}
        opciones={opciones}
        selectedOption={selectedOption}
        disabled={disabled}
        ariaLabel={ariaLabel}
        className={className}
        footer={footer}
        renderOptionEnd={renderOptionEnd}
      />
    );
  }

  return (
    <Select
      value={currentVal}
      onValueChange={(val) => {
        const matched = opciones.find((o) => o.value === val);
        onChange?.(matched ? matched.value : val);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("h-10", className)} aria-label={ariaLabel}>
        <SelectValue placeholder={selectedOption?.label || "Seleccionar..."}>
          {selectedOption ? <TextoOpcion texto={selectedOption.label} /> : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {opciones.map((opcion) => (
          <SelectItem key={opcion.value} value={opcion.value}>
            <TextoOpcion texto={opcion.label} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UiSelectAdvanced({
  id,
  value,
  onChange,
  opciones,
  selectedOption,
  disabled,
  ariaLabel,
  className,
  footer,
  renderOptionEnd,
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const cerrar = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", cerrar);
    return () => document.removeEventListener("pointerdown", cerrar);
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">
          {selectedOption ? <TextoOpcion texto={selectedOption.label} /> : null}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 min-w-full w-max max-w-sm rounded-md border bg-popover text-popover-foreground shadow-lg p-1">
          <ul role="listbox" aria-labelledby={id} className="max-h-60 overflow-y-auto space-y-0.5">
            {opciones.map((opcion) => {
              const isSelected = opcion.value === String(value ?? "");
              return (
                <li
                  key={opcion.value}
                  className="flex items-center justify-between gap-1 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => {
                    onChange?.(opcion.value);
                    setOpen(false);
                  }}
                >
                  <span className={cn("truncate", isSelected && "font-semibold")}>
                    <TextoOpcion texto={opcion.label} />
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {renderOptionEnd?.(opcion)}
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                </li>
              );
            })}
          </ul>
          {footer && <div className="border-t mt-1 pt-1">{footer}</div>}
        </div>
      )}
    </div>
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};

export default Select;
