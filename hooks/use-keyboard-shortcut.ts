import { useEffect } from "react";

export interface UseKeyboardShortcutOptions {
	key: string;
	onTrigger: () => void;
	enabled?: boolean;
	isInModal?: boolean;
	isFocusedInInputField?: boolean;
}

export function useKeyboardShortcut({
	key,
	onTrigger,
	enabled = true,
	isInModal = false,
	isFocusedInInputField = false,
}: UseKeyboardShortcutOptions): void {
	useEffect(() => {
		if (!enabled || isInModal) {
			return;
		}

		const handleKeyPress = (event: KeyboardEvent) => {
			const active = document.activeElement as HTMLElement | null;
			const isTypingTarget =
				(active &&
					(active.tagName === "INPUT" ||
						active.tagName === "TEXTAREA" ||
						active.isContentEditable)) ||
				false;

			if (
				event.key === key &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.altKey &&
				!isFocusedInInputField &&
				!isTypingTarget
			) {
				event.preventDefault();
				onTrigger();
			}
		};

		document.addEventListener("keydown", handleKeyPress);
		return () => document.removeEventListener("keydown", handleKeyPress);
	}, [key, onTrigger, enabled, isInModal, isFocusedInInputField]);
}

