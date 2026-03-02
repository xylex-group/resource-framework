import { UseNotificationOptions } from "@/hooks/use-notifications";
import { updateDataViaAthena } from "../adapters/athena-gateway";

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
            const response = await updateDataViaAthena({
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
        } catch {
            notification({
                message: "Update failed",
                success: false,
            });
        }
    }
};
