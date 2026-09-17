import { esTeclaNumericaPermitida, filtrarDecimales, filtrarEnteros } from "../../lib/numericInput";

/**
 * Input que solo acepta números (enteros o decimales).
 * Bloquea letras al teclear, pegar o insertar.
 */
export function NumericInput({
  decimal = false,
  maxLength,
  value,
  onChange,
  name,
  onKeyDown,
  ...rest
}) {
  const sanitize = (raw) => {
    let next = decimal ? filtrarDecimales(raw) : filtrarEnteros(raw);
    if (maxLength != null && Number.isFinite(Number(maxLength))) {
      next = next.slice(0, Number(maxLength));
    }
    return next;
  };

  const handleKeyDown = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (
      event.key &&
      event.key.length === 1 &&
      !esTeclaNumericaPermitida(event.key, { decimal, valorActual: value })
    ) {
      event.preventDefault();
    }
  };

  const handleChange = (event) => {
    if (!onChange) return;
    const raw = event?.target?.value ?? "";
    const sanitized = sanitize(raw);
    if (event.target) {
      event.target.value = sanitized;
    }
    onChange(event);
  };

  return (
    <input
      {...rest}
      name={name}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      autoComplete="off"
      maxLength={maxLength}
      value={value ?? ""}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
    />
  );
}
