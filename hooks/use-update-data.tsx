"use client";

// TODO: TO BE DEPRECATED - Use useApiClient instead

import { useState } from "react";
import { useApiClient } from "./use-api-client";

interface UpdateConfig {
	onSuccess?: () => void;
	onError?: () => void;
}

const noop = () => {};

const defaultConfig: Required<UpdateConfig> = {
	onSuccess: noop,
	onError: noop,
};

interface UseUpdateProps {
	table: string;
	column: string;
	id: string | number;
	updateBody?: Record<string, unknown>;
	config?: UpdateConfig;
	schema?: string;
}

interface UseUpdateState {
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: string;
}

/**
 * @deprecated This hook is deprecated. Use useApiClient instead for better type safety and features.
 * This is now a wrapper around useApiClient for backwards compatibility.
 */
export function useUpdateData({
	table,
	column,
	id,
	updateBody: initialUpdateBody = {},
	config,
	schema = "public",
}: UseUpdateProps) {
	const [state, setState] = useState<UseUpdateState>({
		isLoading: false,
		isSuccess: false,
		isError: false,
		error: "",
	});

	// Use the new useApiClient hook but disable automatic fetching
	const apiClient = useApiClient({
		table: table || "placeholder",
		enabled: false,
		schema,
	});

	// Type guard to ensure we have the single-table interface
	const hasUpdateMethod = (
		client: typeof apiClient,
	): client is typeof apiClient & {
		update: (
			column: string,
			id: string | number,
			updateBody: Record<string, unknown>,
		) => Promise<void>;
	} => {
		return "update" in client && typeof client.update === "function";
	};

	const update = async (newUpdateBody?: Record<string, unknown>) => {
		console.log("[useUpdateData] Starting update with:", {
			table,
			column,
			id,
			updateBody: newUpdateBody || initialUpdateBody,
		});

		if (!table) {
			console.error("[useUpdateData] Missing table parameter");
			setState({
				isLoading: false,
				isSuccess: false,
				isError: true,
				error: "Missing table parameter",
			});
			return false;
		}

		if (!column) {
			console.error("[useUpdateData] Missing column parameter");
			setState({
				isLoading: false,
				isSuccess: false,
				isError: true,
				error: "Missing column parameter",
			});
			return false;
		}

		if (!id) {
			console.error("[useUpdateData] Missing id parameter");
			setState({
				isLoading: false,
				isSuccess: false,
				isError: true,
				error: "Missing id parameter",
			});
			return false;
		}

		const mergedConfig: Required<UpdateConfig> = {
			...defaultConfig,
			...config,
		};

		setState({ ...state, isLoading: true, isError: false, error: "" });

		try {
			const updateBody = newUpdateBody || initialUpdateBody;
			console.log("[useUpdateData] Calling apiClient.update with:", {
				column,
				id,
				updateBody,
			});

			if (!hasUpdateMethod(apiClient)) {
				throw new Error("API client does not have update method");
			}

			await apiClient.update(column, id, updateBody);

			console.log("[useUpdateData] Update successful");
			setState({
				isLoading: false,
				isSuccess: true,
				isError: false,
				error: "",
			});
			mergedConfig.onSuccess();
			return true;
		} catch (err) {
			const errorMessage = err instanceof Error
				? err.message
				: "Failed to update data";
			console.error("[useUpdateData] Update failed:", errorMessage);
			setState({
				isLoading: false,
				isSuccess: false,
				isError: true,
				error: errorMessage,
			});
			mergedConfig.onError();
			return false;
		}
	};

	return {
		...state,
		update,
	};
}
