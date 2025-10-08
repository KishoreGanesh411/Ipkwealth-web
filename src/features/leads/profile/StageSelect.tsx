import React from "react";
import { STAGE_OPTIONS, type StageOption } from "./gql";

export default function StageSelect({ value, onChange, disabled = false }: {
  value?: StageOption | null;
  onChange: (next: StageOption) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value as StageOption)}
      disabled={disabled}
      className="mt-1 w-full rounded border px-3 py-2 focus:outline-none"
    >
      <option value="" disabled>
        Select stage
      </option>
      {STAGE_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

