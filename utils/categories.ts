import type { ColumnConfigObject, ColumnConfiguration } from "@/lib/types";

export function buildCategoryByKey(
    configured: ColumnConfiguration[] | undefined,
): Map<string, string | undefined> {
    const categoryByKey = new Map<string, string | undefined>();
    if (Array.isArray(configured)) {
        configured.forEach((c) => {
            if (
                typeof c === "object" &&
                (
                    c as ColumnConfigObject
                )?.column_name
            ) {
                const cat = (c as ColumnConfigObject & {
                    category?: string;
                })
                    .category;
                categoryByKey.set(
                    String(
                        (
                            c as ColumnConfigObject
                        ).column_name,
                    ),
                    cat,
                );
            }
        });
    }
    return categoryByKey;
}
