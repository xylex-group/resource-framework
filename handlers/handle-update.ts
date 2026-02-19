import { UseNotificationOptions } from "@/hooks/use-notifications";
import type { DataCondition } from "@/lib/actions/data";
import { fetchData, updateData } from "@/lib/actions/data";

export const handleUpdate = async (
    newValue: unknown,
    notification: (options: UseNotificationOptions) => void,
    onValueChange: (value: unknown) => void,
    data: {
        updateTable: string;
        updateIdColumn: string;
        updateColumn: string;
        resource_id: string;
    },
) => {
    onValueChange(newValue);
    const { updateTable, updateIdColumn, updateColumn, resource_id } = data;
    if (
        updateTable &&
        updateIdColumn &&
        updateColumn &&
        resource_id &&
        resource_id !== "new"
    ) {
        try {
            const response = await updateData({
                table_name: updateTable,
                schema: "public",
                x_column: updateIdColumn,
                x_id: resource_id,
                update_body: { [updateColumn]: newValue },
            });

            if (!response.error) {
                notification({
                    message: "Updated successfully",
                    success: true,
                });
            } else {
                notification({
                    message: "Update failed",
                    success: false,
                });
            }
        } catch (e) {
            notification({
                message: "Update failed",
                success: false,
            });
        }
    }
};
