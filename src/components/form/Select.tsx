import React, { useEffect, useMemo, useState } from "react";

export interface Option {
  value: string;
  label: string;
}

export interface SelectProps {
  /** Accept both mutable and readonly arrays */
  options: ReadonlyArray<Option>;
  /** Controlled value (preferred) */
  value?: string;
  /** Uncontrolled initial value */
  defaultValue?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  name?: string;
  id?: string;
  disabled?: boolean;
  /** Pass through for a11y/lint */
  "aria-invalid"?: boolean | "true" | "false";
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  defaultValue = "",
  placeholder = "Select an option",
  onChange,
  className = "",
  style,
  name,
  id,
  disabled = false,
  "aria-invalid": ariaInvalid,
}) => {
  // Controlled vs uncontrolled
  const isControlled = typeof value === "string";
  const [inner, setInner] = useState<string>(defaultValue);

  // Keep uncontrolled state in sync if defaultValue changes
  useEffect(() => {
    if (!isControlled) setInner(defaultValue);
  }, [defaultValue, isControlled]);

  const selectedValue = isControlled ? (value as string) : inner;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!isControlled) setInner(next);
    onChange(next);
  };

  // Compute classes based on whether a value is selected
  const toneClass = useMemo(
    () =>
      selectedValue
        ? "text-gray-800 dark:text-white/90"
        : "text-gray-400 dark:text-gray-400",
    [selectedValue]
  );

  return (
    <select
      id={id}
      name={name}
      disabled={disabled}
      style={style}
      className={`h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${toneClass} ${className}`}
      value={selectedValue}
      onChange={handleChange}
      aria-invalid={ariaInvalid}
    >
      {/* Placeholder option */}
      <option
        value=""
        disabled
        className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
      >
        {placeholder}
      </option>

      {/* Options */}
      {options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
