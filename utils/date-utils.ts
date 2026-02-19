import { DateInputMode } from "@/packages/resource-framework/resource-types";
import { FormStateData } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";

export const parseToDate = (
    value: string | undefined,
): Date | null => {
    if (value == null || value === "") return null;
    if (typeof value === "number") {
        const millis = value > 1e12 ? value : value * 1000;
        return new Date(millis);
    }
    if (typeof value === "string") {
        const asNumber = Number(value);
        const millis = !Number.isNaN(asNumber)
            ? asNumber > 1e12 ? asNumber : asNumber * 1000
            : undefined;
        if (typeof millis === "number") {
            return new Date(millis);
        }
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
            return new Date(parsed);
        }
    }
    return null;
};

export const toDatePickerValue = (
    value: string,
): string => {
    const date = parseToDate(value);
    if (!date) return "";
    return date.toISOString().slice(0, 10);
};

export const toDateTimeLocalValue = (
    value: string,
): string => {
    const date = parseToDate(value);
    if (!date) return "";
    const offsetMs = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offsetMs);
    return local.toISOString().slice(0, 16);
};

export const detectDateInputMode = (
    editorType: string | undefined,
    datatype: string | undefined,
): DateInputMode | undefined => {
    if (editorType === "date") return "date";
    const dt = String(datatype || "").toLowerCase();
    if (dt.includes("unixtime")) return "unixtime";
    if (
        dt.includes("timestamp") ||
        dt.includes("datetime") ||
        dt.includes("time")
    ) {
        return "datetime";
    }
    if (dt.includes("date")) return "date";
    return undefined;
};

export const convertDateInputValue = (
    inputValue: string,
    mode: DateInputMode,
): string | number => {
    if (!inputValue) return "";
    const parsed = new Date(inputValue);
    if (Number.isNaN(parsed.getTime())) return "";
    if (mode === "unixtime") {
        return Math.floor(parsed.getTime() / 1000);
    }
    if (mode === "datetime") {
        return parsed.toISOString();
    }
    return inputValue;
};
export const handleDateInputChange = (
    fieldKey: string,
    inputValue: string,
    dateInputMode: DateInputMode | undefined,
    setFormState: Dispatch<SetStateAction<FormStateData>>,
): void => {
    if (!dateInputMode) return;
    const next = convertDateInputValue(
        inputValue,
        dateInputMode,
    );
    setFormState((s) => ({
        ...s,
        [fieldKey]: next,
    }));
};
