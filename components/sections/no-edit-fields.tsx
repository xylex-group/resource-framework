import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export interface ResourceDrilldownNoEditFieldsProps {
    id?: string;
    canCreateNew: boolean;
    href?: string;
    createLabel: string;
}

export const ResourceDrilldownNoEditFields = ({
    id,
    canCreateNew,
    href,
    createLabel,
}: ResourceDrilldownNoEditFieldsProps) => (
    <div
        id={id}
        className="flex flex-col items-center justify-center px-4 py-12"
    >
        <div className="rounded-sm bg-muted p-6">
            <FileText className="h-12 w-12 text-primary" />
        </div>
        <p className="mt-4 text-sm text-primary">No fields available to edit</p>
        {canCreateNew && href && (
            <Button
                variant="default"
                className="mt-4 rounded-sm"
                onClick={() => {
                    window.location.href = href;
                }}
            >
                {createLabel}
            </Button>
        )}
    </div>
);
