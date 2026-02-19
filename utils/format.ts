// Helper function to format values for input fields
export const formatValueForInput = (val: unknown): string => {
    if (val == null) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") {
        return String(val);
    }
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "object") {
        try {
            return JSON.stringify(val);
        } catch {
            return "[Object]";
        }
    }
    return String(val);
};
