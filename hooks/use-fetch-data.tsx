import { useEffect, useRef, useState } from "react";
import { fetchDataViaAthena } from "../adapters/athena-gateway";
import { applyCacheStateRegistry } from "@/lib/cache-state-registry";
import { useUserStore } from "@/lib/stores";

interface FetchConditions {
	eq_column: string;
	eq_value: string | number | boolean | null | undefined;
}

interface FetchConfig {
	onSuccess?: () => void;
	onError?: () => void;
	stripNulls?: boolean;
}

const noop = () => {};

const defaultConfig: Required<FetchConfig> = {
	onSuccess: noop,
	onError: noop,
	stripNulls: true,
};

interface UseFetchProps {
	table: string;
	conditions?: FetchConditions | FetchConditions[];
	config?: FetchConfig;
	limit?: number;
	cached?: boolean;
}

interface UseFetchState<T> {
	data: T | null;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
	error: string;
}

/**
 * @deprecated This hook is deprecated. Use useApiClient instead for better type safety and features.
 * Migrated to use Drizzle ORM via server actions.
 */
export function useFetchData<T = unknown>({
	table,
	conditions,
	config,
	limit,
	cached: _cached,
}: UseFetchProps) {
	const [state, setState] = useState<UseFetchState<T>>({
		data: null,
		isLoading: true,
		isSuccess: false,
		isError: false,
		error: "",
	});

	const { user } = useUserStore();

	const configRef = useRef(config);
	const conditionsRef = useRef(conditions);

	useEffect(() => {
		if (
			JSON.stringify(conditionsRef.current) !== JSON.stringify(conditions)
		) {
			conditionsRef.current = conditions;
		}

		if (JSON.stringify(configRef.current) !== JSON.stringify(config)) {
			configRef.current = config;
		}
	}, [conditions, config]);

	useEffect(() => {
		if (!table) {
			console.warn("useFetchData: No table specified");
			return;
		}

		const mergedConfig: Required<FetchConfig> = {
			...defaultConfig,
			...(configRef.current || {}),
		};

		setState((s) => ({ ...s, isLoading: true }));

		const fetchDataAsync = async () => {
			try {
				// Convert conditions to array format
				const conditionsArray = conditionsRef.current
					? Array.isArray(conditionsRef.current)
						? conditionsRef.current
						: [conditionsRef.current]
					: [];

				const response = await fetchDataViaAthena({
					table_name: table,
					conditions: conditionsArray.map((c) => ({
						eq_column: c.eq_column,
						eq_value: c.eq_value ?? null,
					})),
					limit: limit || 100,
					offset: 0,
				});

				if (response.error) {
					throw new Error(response.error);
				}

				if (response.data) {
					setState({
						data: response.data as T,
						isLoading: false,
						isSuccess: true,
						isError: false,
						error: "",
					});
					try {
						// Update Zustand store automatically for known table/column mappings
						applyCacheStateRegistry(
							table,
							response.data as
								| Record<string, unknown>[]
								| Record<string, unknown>
								| null,
						);
					} catch {}
					mergedConfig.onSuccess();
				}
			} catch (err: unknown) {
				const errorMessage = err instanceof Error
					? err.message
					: "Failed to fetch";
				console.error(
					"useFetchData: Error fetching data:",
					errorMessage,
				);
				setState({
					data: null,
					isLoading: false,
					isSuccess: false,
					isError: true,
					error: errorMessage,
				});
				mergedConfig.onError();
			}
		};

		fetchDataAsync();
	}, [table, limit, user?.company_id, user?.organization_id, user?.user_id]);

	return state;
}
