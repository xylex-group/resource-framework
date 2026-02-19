"use client";

import { X } from "lucide-react";
import { type ReactNode } from "react";
import { InformationIcon } from "@/components/icons";

export interface NotificationConfig {
  dismissible: boolean;
  duration: number;
  className: string;
  descriptionClassName: string;
  icon: ReactNode;
  action: {
    label: ReactNode;
    onClick: () => void;
    actionButtonStyle: React.CSSProperties;
  };
}

/**
 * Default notification configuration used across the resource framework
 */
export const defaultNotificationConfig: Partial<NotificationConfig> = {
  dismissible: true,
  duration: 3000,
  className: "h-[43px] p-0 pl-3 rounded-sm border text-primary font-medium data-title",
  descriptionClassName: "text-primary",
  icon: <InformationIcon />,
};

/**
 * Get the action button configuration for closing notifications
 */
export const getCloseAction = (onDismiss: () => void) => ({
  label: <X className="stroke-icon h-4 w-4" />,
  onClick: onDismiss,
  actionButtonStyle: {
    cursor: "default",
  } as React.CSSProperties,
});
