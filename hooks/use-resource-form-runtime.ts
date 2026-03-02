import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ResolvedResourceForm } from "../utils/resource-forms";

export type UseResourceFormRuntimeResult = {
  forms: ResolvedResourceForm[];
  selectedFormId: string | null;
  setSelectedFormId: (id: string | null) => void;
  selectedForm: ResolvedResourceForm | null;
  values: Record<string, unknown>;
  setValues: Dispatch<SetStateAction<Record<string, unknown>>>;
  updateValue: (key: string, value: unknown) => void;
  resetValues: () => void;
};

export function useResourceFormRuntime(
  forms: ResolvedResourceForm[],
): UseResourceFormRuntimeResult {
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!forms.length) {
      setSelectedFormId(null);
      return;
    }

    setSelectedFormId((current) =>
      current && forms.some((form) => form.id === current)
        ? current
        : forms[0]?.id ?? null,
    );
  }, [forms]);

  const selectedForm = useMemo(
    () => forms.find((form) => form.id === selectedFormId) ?? forms[0] ?? null,
    [forms, selectedFormId],
  );

  useEffect(() => {
    setValues(selectedForm?.defaultValues ? { ...selectedForm.defaultValues } : {});
  }, [selectedForm]);

  return {
    forms,
    selectedFormId,
    setSelectedFormId,
    selectedForm,
    values,
    setValues,
    updateValue: (key, value) => {
      setValues((current) => ({
        ...current,
        [key]: value,
      }));
    },
    resetValues: () => {
      setValues(selectedForm?.defaultValues ? { ...selectedForm.defaultValues } : {});
    },
  };
}
