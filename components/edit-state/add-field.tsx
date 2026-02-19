import { Plus } from "lucide-react";
import { ResponsiveDropdownV2 } from "@/components/ui-responsive/responsive-dropdown-v2";
import { cn } from "@/lib/utils";

interface FieldMeta {
  headerText?: string;
  [key: string]: unknown;
}

interface AddFieldProps {
  hiddenInSection: string[];
  metaByKey: Map<string, FieldMeta>;
  setVisibleFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFormState?: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  data?: Record<string, unknown>;
  className?: string;
}

export function AddField({
  hiddenInSection,
  metaByKey,
  setVisibleFields,
  setFormState,
  data,
  className,
}: AddFieldProps) {
  return (
    <ResponsiveDropdownV2
      enableSearch={false}
      noResultsMessage="No fields found"
      scrollBarInvisible
      forceNativeOnMobile={false}
      items={hiddenInSection.map((k: string) => {
        const meta = metaByKey.get(k) || {};
        const headerText = meta.headerText || k.replace(/_/g, " ");
        return {
          buttonText: headerText,
          onClick: () => {
            setVisibleFields((prev) => {
              const next = new Set(prev);
              next.add(k);
              return next;
            });
            if (setFormState) {
              setFormState((prev) => {
                const newState = {
                  ...prev,
                  [k]: data?.[k] ?? null,
                };

                return newState;
              });
            }
          },
        };
      })}
      triggerButton={
        <div
          id="resource-drilldown-add-field-trigger"
          className={cn(
            "w-full rounded-sm border border-dashed p-4 transition-colors duration-100 hover:bg-hover/20 cursor-default select-none ",
            className,
          )}
        >
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Plus className="h-4 w-4" />
            Add field
          </div>
        </div>
      }
    />
  );
}
