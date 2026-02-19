import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type EditorConfig } from "@/lib/types";
import DeleteField from "./delete-field";

interface SelectArrayAdapterProps {
    value: unknown;
    editorCfg: EditorConfig;
    fieldKey: string;
    isAddedField?: boolean;
    onValueChange: (value: unknown) => void;
    onDelete?: (key: string) => void;
}

export default function SelectArrayAdapter({
    value,
    editorCfg,
    fieldKey,
    isAddedField = false,
    onValueChange,
    onDelete,
}: SelectArrayAdapterProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1">
                <Select
                    value={value == null
                        ? ""
                        : (typeof value === "object" ? "" : String(value))}
                    onValueChange={(val: string) => {
                        const opt = editorCfg.options?.find(
                            (o) => String(o.value) === val,
                        );
                        const nextVal = opt ? opt.value : val;
                        onValueChange(nextVal);
                    }}
                >
                    <SelectTrigger className="min-w-45 rounded-sm">
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                        {editorCfg.options?.map((opt, idx) => (
                            <SelectItem
                                key={`${String(opt.value)}-${idx}`}
                                value={String(opt.value)}
                            >
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {isAddedField && onDelete && (
                <DeleteField fieldKey={fieldKey} onDelete={onDelete} />
            )}
        </div>
    );
}
