import type React from "react";
import { AvatarCard } from "@/components/cards/avatar-card";
import {
	DrilldownSection,
	DrilldownSummary,
	DrilldownSummaryItem,
} from "./index";
import { MouseEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SectionWidgetGroup } from "@/packages/resource-framework/components/sections/section-widget";
import type { DrilldownSectionWidgetSpec } from "@/packages/resource-framework/resource-types";

export interface EntityField<T extends Record<string, unknown>> {
	key: string;
	label: string;
	render?: (value: unknown, entity: T) => ReactNode;
	hidden?: boolean;
	formatter?: (value: unknown) => string;
	is_user_id?: boolean;
	href?: string;
	target?: string;
	className?: string;
}

interface EntityRendererProps<T extends Record<string, unknown>> {
	entity: T;
	fields: EntityField<T>[];
	columns?: 1 | 2 | 3 | 4;
	title?: string;
	custom_component?: ReactNode;
	className?: string;
	isLoading?: boolean;
	autoHideEmptyFields?: boolean;
	autoHideEmptyColumns?: boolean;
	exposeToEditState?: boolean;
	widgets?: DrilldownSectionWidgetSpec[];
}

function isEmpty(value: unknown): boolean {
	if (value == null) return true;
	if (typeof value === "string" && value.trim() === "") return true;
	if (Array.isArray(value) && value.length === 0) return true;
	if (typeof value === "object" && Object.keys(value).length === 0) {
		return true;
	}
	return false;
}

export function DrilldownEntityRenderer<T extends Record<string, unknown>>({
	entity,
	fields,
	title,
	columns = 2,
	custom_component,
	className,
	isLoading = false,
	autoHideEmptyFields,
	autoHideEmptyColumns,
	exposeToEditState,
	widgets,
}: EntityRendererProps<T>) {
	const visibleFields = fields.filter((field) => !field.hidden);
	const shouldAutoHideEmpty = autoHideEmptyFields ?? autoHideEmptyColumns ??
		true;

	return (
		<div id="drilldown-entity-renderer-root">
			<DrilldownSection
				title={title}
				no_padding
				className={cn(className)}
			>
				<div className="sm:px-0">
					<DrilldownSummary columns={columns} className="mb-2">
						{isLoading
							// Skeleton loading state
							? Array.from({ length: 6 }).map((_, idx) => (
								<div
									key={idx}
									className="flex min-w-0 flex-col sm:flex-row sm:items-center gap-1 sm:gap-4"
								>
									<Skeleton className="h-3 w-24 sm:w-40 shrink-0" />
									<Skeleton className="h-4 w-full sm:flex-1" />
								</div>
							))
							: visibleFields.map((field, idx) => {
								const value = field.key.includes(".")
									? field.key.split(".").reduce<unknown>(
										(obj, key) => {
											if (
												obj && typeof obj === "object"
											) {
												return (obj as Record<
													string,
													unknown
												>)[
													key
												];
											}
											return undefined;
										},
										entity as Record<string, unknown>,
									)
									: entity[field.key];

								if (shouldAutoHideEmpty && isEmpty(value)) {
									return null;
								}

								// Skip null/empty fields unless they have a custom render
								const shouldHide = isEmpty(value) &&
									!field.render &&
									shouldAutoHideEmpty;
								if (shouldHide) {
									return null;
								}

								const formattedValue = field.formatter
									? field.formatter(value)
									: value;

								let displayValue: React.ReactNode =
									formattedValue as React.ReactNode;
								if (
									isEmpty(value) && !field.render &&
									!shouldAutoHideEmpty
								) {
									displayValue = "-";
								}

								if (field.render) {
									displayValue = field.render(
										formattedValue,
										entity,
									);
								} else if (
									typeof field.href === "string" &&
									field.href.length > 0
								) {
									const resolvedHref = field.href.replace(
										/\{\{(.*?)\}\}/g,
										(_, p1) => {
											const keyPath = String(p1 || "")
												.trim();
											const v = keyPath.includes(".")
												? keyPath
													.split(".")
													.reduce<unknown>(
														(obj, k: string) => {
															if (
																obj &&
																typeof obj ===
																	"object"
															) {
																return (obj as Record<
																	string,
																	unknown
																>)[k];
															}
															return undefined;
														},
														entity as Record<
															string,
															unknown
														>,
													)
												: entity[keyPath];
											return encodeURIComponent(
												String(v ?? ""),
											);
										},
									);
									const linkLabel = formattedValue == null ||
											formattedValue === ""
										? String(field.label)
										: String(formattedValue);
									displayValue = (
										<Button
											asChild
											variant="link"
											onClick={(e: MouseEvent) =>
												e.stopPropagation()}
										>
											<a
												href={resolvedHref}
												target={field.target ||
													"_blank"}
												rel="noopener noreferrer"
											>
												{linkLabel}
											</a>
										</Button>
									);
								} else if (field.is_user_id) {
									displayValue = (
										<div className="flex flex-row items-center gap-x-2">
											<AvatarCard
												user_id={formattedValue as string}
											/>
										</div>
									);
								} else if (
									typeof formattedValue === "string" &&
									formattedValue.length > 40
								) {
									displayValue = (
										<span
											className="block max-w-xs truncate text-ellipsis"
											title={formattedValue}
										>
											{formattedValue}
										</span>
									);
								}

								return (
									<DrilldownSummaryItem
										key={field.key}
										label={
											<span className="flex items-center gap-x-1">
												<span className="font-semibold capitalize">
													{field.label}
												</span>
											</span>
										}
										value={displayValue}
									/>
								);
							})}
					</DrilldownSummary>
					<SectionWidgetGroup
						widgets={widgets ?? []}
						entity={entity}
					/>
					{custom_component}
				</div>
			</DrilldownSection>
		</div>
	);
}
