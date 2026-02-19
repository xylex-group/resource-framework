export function prettyString(input: string, uppercase?: boolean): string {
  if (!input) {
    return "";
  }
  let formatted = input.replace(/_/g, " ");
  formatted = formatted.replace(/([a-z])([A-Z])/g, "$1 $2");
  if (uppercase) {
    return formatted.toUpperCase();
  }
  return formatted.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
