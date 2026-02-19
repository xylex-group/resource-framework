import type { DataCondition } from "@/lib/actions/data";
import { fetchData } from "@/lib/actions/data";
import type { DataSourceConfig, SelectOption } from "@/lib/types";
import type { ResourceRoute } from "../resource-types";

export type { DataSourceConfig };

export interface FetchOptionsParams {
    dataSource: DataSourceConfig;
    user?: {
        organization_id?: string | null;
        user_id?: string | null;
    };
    resource?: ResourceRoute | null;
    setOptions: (options: SelectOption[]) => void;
    setLoading: (loading: boolean) => void;
}

export const fetchOptions = async ({
    dataSource,
    user,
    resource,
    setOptions,
    setLoading,
}: FetchOptionsParams) => {
    setLoading(true);
    try {
        const ds = typeof dataSource === "string"
            ? { table: dataSource.split(".")[0] }
            : dataSource;
        const table = ds.table;
        const conditions: DataCondition[] = [];
        if (
            user?.organization_id &&
            !resource?.disableCompanyFilter
        ) {
            conditions.push({
                eq_column: "organization_id",
                eq_value: user.organization_id,
            });
        }

        const response = await fetchData({
            table_name: table,
            schema: "public",
            conditions,
            limit: 100,
        });

        if (!response.error && response.data) {
            const rows = Array.isArray(response.data) ? response.data : [];
            const valueCol = ds.value_column || `${table}_id` ||
                "id";
            const labelCol = ds.label_column || "name";

            setOptions(
                rows.map((r) => {
                    const rowData = r as Record<string, unknown>;
                    return {
                        label: String(
                            rowData[labelCol] || rowData[valueCol] || "",
                        ),
                        value: rowData[valueCol] as
                            | string
                            | number
                            | boolean,
                    };
                }),
            );
        }
    } catch (e) {
        console.error("Failed to fetch options", e);
    } finally {
        setLoading(false);
    }
};
