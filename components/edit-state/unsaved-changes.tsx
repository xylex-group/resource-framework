import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    CircleCheck,
    CircleWarning,
    Loader2,
    TriangleWarning,
} from "@/components/icons";

const unsavedChangesVariants = cva(
    "fixed inset-x-0 z-50 mx-auto w-fit flex items-center gap-2 rounded-full p-2 pl-3 text-sm font-medium shadow-lg shadow-black/5 border bg-background overflow-hidden",
    {
        variants: {
            position: {
                bottom: "bottom-3",
                top: "top-3",
            },
            size: {
                sm: "h-10",
                default: "h-11",
                lg: "h-12",
            },
        },
        defaultVariants: {
            position: "bottom",
            size: "default",
        },
    },
);

export interface UnsavedChangesProps
    extends VariantProps<typeof unsavedChangesVariants> {
    /** Additional CSS class */
    className?: string;
    /** Show/hide the component */
    open?: boolean;
    /** Saving in progress state */
    isSaving?: boolean;
    /** Save success state */
    success?: boolean;
    /** Error state */
    error?: boolean;
    /** Default label (default: "Unsaved Changes") */
    label?: string;
    /** Label while saving */
    savingLabel?: string;
    /** Label after successful save */
    successLabel?: string;
    /** Label on error */
    errorLabel?: string;
    /** Reset button text */
    resetLabel?: string;
    /** Save button text */
    saveLabel?: string;
    /** Reset callback */
    onReset?: () => void;
    /** Save callback */
    onSave?: () => void;
    /** Disable all buttons */
    disabled?: boolean;
    /** Disable only Reset button */
    resetDisabled?: boolean;
    /** Disable only Save button */
    saveDisabled?: boolean;
    /** Custom icon */
    icon?: React.ReactNode;
    /** Hide Reset button */
    hideReset?: boolean;
    /** List of changed fields */
    changes?: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

/**
 * UnsavedChanges Component
 *
 * Animated floating bar to notify unsaved changes with saving states.
 *
 * @example
 * ```tsx
 * <UnsavedChanges
 *   open={hasChanges}
 *   isSaving={isSaving}
 *   success={isSuccess}
 *   error={isError}
 *   onReset={handleReset}
 *   onSave={handleSave}
 * />
 * ```
 */
function UnsavedChanges({
    className,
    open = true,
    isSaving = false,
    success = false,
    error = false,
    position,
    size,
    label = "Unsaved Changes",
    savingLabel = "Saving…",
    successLabel = "Changes saved",
    errorLabel = "An error occurred",
    resetLabel = "Reset",
    saveLabel = "Save",
    onReset,
    onSave,
    disabled = false,
    resetDisabled = false,
    saveDisabled = false,
    icon,
    hideReset = false,
    changes = [],
}: UnsavedChangesProps) {
    const [showChanges, setShowChanges] = React.useState(false);
    const hasChanges = changes && changes.length > 0;
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    layout
                    style={{ borderRadius: 24 }}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{
                        type: "spring",
                        visualDuration: 0.3,
                        bounce: 0.15,
                    }}
                    className={cn(
                        unsavedChangesVariants({ position, size, className }),
                    )}
                    role="alert"
                    aria-live="polite"
                >
                    <Popover isOpen={showChanges} onOpenChange={setShowChanges}>
                        <Button
                            type="button"
                            variant="ghost"
                            className={cn(
                                "flex items-center gap-2 text-foreground outline-none h-auto p-0 hover:bg-transparent",
                                hasChanges && !isSaving && !success && !error &&
                                    "cursor-pointer hover:opacity-80 transition-opacity",
                            )}
                            disabled={!hasChanges || isSaving || success ||
                                error}
                        >
                            <motion.div
                                layout="position"
                                className="flex items-center gap-2"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {error
                                        ? (
                                            <motion.div
                                                key="error"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <CircleWarning className="text-destructive" />
                                            </motion.div>
                                        )
                                        : success
                                        ? (
                                            <motion.div
                                                key="success"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <CircleCheck className="text-emerald-500" />
                                            </motion.div>
                                        )
                                        : isSaving
                                        ? (
                                            <motion.div
                                                key="saving"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Loader2 className="text-muted-foreground" />
                                            </motion.div>
                                        )
                                        : (
                                            <motion.div
                                                key="default"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.5,
                                                }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {icon ?? (
                                                    <TriangleWarning className="text-muted-foreground" />
                                                )}
                                            </motion.div>
                                        )}
                                </AnimatePresence>
                                <motion.span
                                    layout="position"
                                    className="whitespace-nowrap mr-1"
                                >
                                    {error
                                        ? errorLabel
                                        : success
                                        ? successLabel
                                        : isSaving
                                        ? savingLabel
                                        : label}
                                </motion.span>
                                {hasChanges && !isSaving && !success &&
                                    !error && (
                                    <ChevronDown className="w-4 h-4 text-primary" />
                                )}
                            </motion.div>
                        </Button>
                        <PopoverContent
                            placement="top"
                            className="w-80 p-0 rounded-sm bg-background"
                        >
                            <div className="p-3 border-b bg-muted/30">
                                <h4 className="text-sm font-medium text-primary">
                                    Changed Fields
                                </h4>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {changes.map((change, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 border-b last:border-b-0 hover:bg-hover/50 transition-colors"
                                    >
                                        <div className="text-sm font-medium text-primary mb-1">
                                            {change.field}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-secondary line-through">
                                                {String(change.oldValue || "-")}
                                            </span>
                                            <span className="text-secondary">
                                                →
                                            </span>
                                            <span className="text-primary font-medium">
                                                {String(change.newValue || "-")}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Actions */}
                    <AnimatePresence mode="popLayout">
                        {!isSaving && !success && !error && (
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 1,
                                    width: "auto",
                                    marginLeft: "1rem",
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    width: "auto",
                                    marginLeft: "1rem",
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.8,
                                    width: 0,
                                    marginLeft: 0,
                                }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    scale: { duration: 0.2 },
                                    width: { duration: 0.2, ease: "easeOut" },
                                    marginLeft: {
                                        duration: 0.2,
                                        ease: "easeOut",
                                    },
                                }}
                                className="relative flex items-center gap-2 overflow-hidden pl-2"
                            >
                                {/* Gradient mask */}
                                <div className="absolute inset-y-0 left-0 w-2 bg-linear-to-r from-transparent to-background z-20 pointer-events-none" />

                                {/* Buttons container with background */}
                                <div className="flex items-center gap-2 bg-background z-10">
                                    {!hideReset && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-7 rounded-full cursor-pointer"
                                            onClick={onReset}
                                            disabled={disabled || resetDisabled}
                                        >
                                            {resetLabel}
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        className="h-7 rounded-full cursor-pointer"
                                        onClick={onSave}
                                        disabled={disabled || saveDisabled}
                                    >
                                        {saveLabel}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export { UnsavedChanges, unsavedChangesVariants };
