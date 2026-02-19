"use client";

import type { ReactNode } from "react";
import Loading from "@/components/ui/loading";
import { useFetchData } from "@/packages/resource-framework/hooks/use-fetch-data";
import { useUserStore } from "@/lib/stores";

interface ScopeWrapperProps {
	children: ReactNode;
	scope: string;
	fallback?: ReactNode;
	emptyLoader?: boolean;
}

export function ScopeWrapper({
	children,
	scope,
	fallback,
	emptyLoader = false,
}: ScopeWrapperProps) {
	const { user } = useUserStore();

	const { data, error, isLoading } = useFetchData({
		table: "user_permission_scopes",
		conditions: [
			{ eq_column: "scope", eq_value: scope },
			{ eq_column: "user_id", eq_value: user?.user_id },
			{ eq_column: "enabled", eq_value: "true" },
		],
		cached: false,
	});

	if (isLoading && !emptyLoader) {
		return;
	}

	if (isLoading && emptyLoader) {
		return <Loading message={`Checking permissions...`} />;
	}

	if (error && emptyLoader) {
		console.error("Error checking permissions:", error);
		return fallback || null;
	}

	if (data && Array.isArray(data) && data.length > 0) {
		return <>{children}</>;
	}

	return fallback || null;
}
