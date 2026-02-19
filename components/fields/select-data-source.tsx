import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { useNotification } from "@/hooks/use-notifications";
import { useUserStore } from "@/lib/stores";
import type { DataSourceConfig, SelectOption } from "@/lib/types";
import { fetchOptions } from "@/packages/resource-framework/handlers/handle-options";
import { handleUpdate } from "@/packages/resource-framework/handlers/handle-update";
import type { ResourceRoute } from "@/packages/resource-framework/resource-types";
import { X } from "lucide-react";

export interface SelectDataSourceProps {
    fieldKey: string;
    value: unknown;
    dataSource: DataSourceConfig;
    resource?: ResourceRoute | null;
    resourceId?: string | null;
    updateTable?: string;
    updateIdColumn?: string;
    updateColumn?: string;
    label?: string;
    onValueChange: (val: unknown) => void;
    isAddedField?: boolean;
    onRemove?: () => void;
}

type DataSourceSelectProps = Omit<
    SelectDataSourceProps,
    "isAddedField" | "onRemove"
>;

const DataSourceSelect = ({
    fieldKey,
    value,
    dataSource,
    resource,
    resourceId,
    updateTable,
    updateIdColumn,
    updateColumn,
    onValueChange,
    label,
}: DataSourceSelectProps) => {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useUserStore();
    const { notification } = useNotification();

    useEffect(() => {
        if (!dataSource || !user?.user_id) {
            return;
        }

        const userForOptions = {
            organization_id: user.organization_id,
            user_id: user.user_id,
        };

        fetchOptions({
            dataSource,
            user: userForOptions,
            resource,
            setOptions,
            setLoading,
        });
    }, [dataSource, resource, user?.organization_id, user?.user_id]);

    const selectedOption = options.find(
        (opt) => String(opt.value) === String(value),
    );

    const handleClickDataSource = () => {
        setIsOpen(true);
        if (!dataSource || !user?.user_id) {
            return;
        }

        const userForOptions = {
            organization_id: user.organization_id,
            user_id: user.user_id,
        };

        fetchOptions({
            dataSource,
            user: userForOptions,
            resource,
            setOptions,
            setLoading,
        });
    };

    return (
        <div className="h-8">
            <ResponsiveDropdownV2
                open={isOpen}
                onOpenChange={setIsOpen}
                dropdownLabel={label ?? `Select ${fieldKey}`}
                items={options.map((opt) => ({
                    buttonText: opt.label,
                    isActive: String(value) === String(opt.value),
                    onClick: () =>
                        handleUpdate(
                            opt.value,
                            notification,
                            onValueChange,
                            {
                                updateTable: updateTable || "",
                                updateIdColumn: updateIdColumn || "",
                                updateColumn: updateColumn || "",
                                resource_id: resourceId || "",
                            },
                        ),
                }))}
                triggerButton={
                    <Button
                        variant="outline_dashed"
                        size="sm"
                        className="h-9 w-full justify-between rounded-sm "
                        onClick={handleClickDataSource}
                    >
                        <span className="truncate text-left text-primary text-sm  ">
                            {selectedOption
                                ? selectedOption.label
                                : loading
                                ? "Loading..."
                                : "Select"}
                        </span>
                    </Button>
                }
                enableSearch
                inputPlaceholder="Search..."
                noResultsMessage="No options"
                forceNativeOnMobile
                scrollBarInvisible
            />
        </div>
    );
};

export default function SelectDataSource({
    fieldKey,
    value,
    dataSource,
    resource,
    resourceId,
    updateTable,
    updateIdColumn,
    updateColumn,
    label,
    onValueChange,
    isAddedField,
    onRemove,
}: SelectDataSourceProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1">
                <DataSourceSelect
                    fieldKey={fieldKey}
                    value={value}
                    dataSource={dataSource}
                    resource={resource}
                    resourceId={resourceId}
                    updateTable={updateTable}
                    updateIdColumn={updateIdColumn}
                    updateColumn={updateColumn}
                    label={label}
                    onValueChange={onValueChange}
                />
            </div>
            {isAddedField && onRemove && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-sm hover:bg-destructive/10"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4 text-destructive" />
                </Button>
            )}
        </div>
    );
}
