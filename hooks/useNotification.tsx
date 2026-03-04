"use client";
import { type ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { defaultNotificationConfig, getCloseAction } from "../notifications";

interface UseNotificationOptions {
	message: string;
	icon?: ReactNode;
	idempotencyKey?: string;
	success?: boolean;
}

export function useNotification() {
	const notification = useCallback((options: UseNotificationOptions) => notify(options), []);
	return { notification };
}

export function notify({
	message,
	icon,
	idempotencyKey,
	success: _success = true,
}: UseNotificationOptions) {
	toast(message, {
		...defaultNotificationConfig,
		icon: icon ?? defaultNotificationConfig.icon,
		action: getCloseAction(() => toast.dismiss()),
		id: idempotencyKey,
	});
}
