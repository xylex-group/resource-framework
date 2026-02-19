import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DeleteFieldProps {
    fieldKey: string;
    onDelete: (key: string) => void;
}

export default function DeleteField({ fieldKey, onDelete }: DeleteFieldProps) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-sm hover:bg-destructive/10"
            onClick={() => onDelete(fieldKey)}
        >
            <X className="h-4 w-4 text-destructive" />
        </Button>
    );
}
