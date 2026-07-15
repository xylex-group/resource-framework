"use client";

import { ComboBox as HeroComboBox, Input, ListBox } from "@heroui/react";
import type { CSSProperties, ReactNode } from "react";

export interface ComboBoxProps {
  ariaLabel?: string;
  allowsEmptyCollection?: boolean;
  children: ReactNode;
  closeOnReselect?: boolean;
  inputValue?: string;
  keepAllItemsVisible?: boolean;
  onInputChange?: (value: string) => void;
  onSelectionChange?: (key: string | null) => void;
  selectedKey?: string | null;
  shouldCloseOnBlur?: boolean;
}

export function ComboBox({ ariaLabel, children, inputValue, onInputChange, onSelectionChange, selectedKey }: ComboBoxProps) {
  return (
    <HeroComboBox
      aria-label={ariaLabel}
      inputValue={inputValue}
      onInputChange={onInputChange}
      onSelectionChange={(key) => onSelectionChange?.(key == null ? null : String(key))}
      selectedKey={selectedKey}
    >
      {children}
    </HeroComboBox>
  );
}

export function ComboBoxInput({ ariaLabel = "Filter options", className, name }: { ariaLabel?: string; className?: string; name?: string }) {
  return (
    <HeroComboBox.InputGroup className={className}>
      <Input aria-label={ariaLabel} id={name} name={name} />
      <HeroComboBox.Trigger />
    </HeroComboBox.InputGroup>
  );
}

export interface ComboBoxContentProps {
  children: ReactNode;
  className?: string;
  popover?: { style?: CSSProperties };
}

export function ComboBoxContent({ children, className, popover }: ComboBoxContentProps) {
  return (
    <HeroComboBox.Popover className={className} style={popover?.style}>
      <ListBox aria-label="Options">{children}</ListBox>
    </HeroComboBox.Popover>
  );
}

export interface ComboBoxItemProps {
  children: ReactNode;
  className?: string;
  id: string;
  textValue?: string;
}

export function ComboBoxItem({ children, ...props }: ComboBoxItemProps) {
  return <ListBox.Item {...props}>{children}</ListBox.Item>;
}
