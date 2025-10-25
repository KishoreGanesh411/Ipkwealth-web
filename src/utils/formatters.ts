export function humanize(value?: string | null): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/_/g, " ")          // handle ENUM_NAME_WITH_UNDERSCORE
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize first letter of each word
}
