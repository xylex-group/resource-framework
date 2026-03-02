"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ComboBoxContextValue = {
  query: string;
  selectedKey: string | null;
  setQuery: (value: string) => void;
  select: (key: string) => void;
};

const ComboBoxContext = createContext<ComboBoxContextValue | null>(null);

function useComboBoxContext() {
  const context = useContext(ComboBoxContext);
  if (!context) {
    throw new Error("ComboBox components must be used inside ComboBox");
  }
  return context;
}

export function ComboBox({
  children,
  selectedKey = null,
  inputValue,
  onSelectionChange,
  onInputChange,
}: {
  children: ReactNode;
  selectedKey?: string | null;
  inputValue?: string;
  shouldCloseOnBlur?: boolean;
  closeOnReselect?: boolean;
  allowsEmptyCollection?: boolean;
  keepAllItemsVisible?: boolean;
  onSelectionChange?: (key: string | null) => void;
  onInputChange?: (value: string) => void;
}) {
  const [query, setQuery] = useState(inputValue ?? "");

  useEffect(() => {
    if (typeof inputValue === "string") {
      setQuery(inputValue);
    }
  }, [inputValue]);

  const value = useMemo<ComboBoxContextValue>(
    () => ({
      query,
      selectedKey,
      setQuery: (next) => {
        setQuery(next);
        onInputChange?.(next);
      },
      select: (key) => {
        onSelectionChange?.(key);
        onInputChange?.(key);
        setQuery(key);
      },
    }),
    [query, selectedKey, onInputChange, onSelectionChange],
  );

  return (
    <ComboBoxContext.Provider value={value}>
      <div className="flex flex-col gap-2">{children}</div>
    </ComboBoxContext.Provider>
  );
}

export function ComboBoxInput({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const { query, setQuery } = useComboBoxContext();

  return (
    <input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-8 w-full rounded-sm border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100",
        className,
      )}
    />
  );
}

export function ComboBoxContent({
  children,
  className,
  popover,
}: {
  children: ReactNode;
  className?: string;
  popover?: { style?: CSSProperties };
}) {
  return (
    <div
      className={cn("rounded-sm border border-slate-700 bg-slate-950 p-1", className)}
      style={popover?.style}
    >
      {children}
    </div>
  );
}

export function ComboBoxItem({
  id,
  textValue,
  children,
  className,
}: {
  id: string;
  textValue?: string;
  children: ReactNode;
  className?: string;
}) {
  const { query, select, selectedKey } = useComboBoxContext();
  const normalizedQuery = query.trim().toLowerCase();
  const compareText = String(textValue ?? children ?? "").toLowerCase();

  if (normalizedQuery && !compareText.includes(normalizedQuery)) {
    return null;
  }

  const isSelected = selectedKey === id;

  return (
    <button
      type="button"
      onClick={() => select(id)}
      className={cn(
        "block w-full rounded-sm px-2 py-1 text-left text-sm text-slate-100 hover:bg-slate-800",
        isSelected && "bg-slate-800",
        className,
      )}
    >
      {children}
    </button>
  );
}
