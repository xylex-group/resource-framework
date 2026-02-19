"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LightboxNavigationProps {
  currentIndex: number;
  totalFiles: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

/**
 * Navigation controls for lightbox
 * Previous/Next buttons with keyboard support
 */
export function LightboxNavigation({
  currentIndex,
  totalFiles,
  onPrevious,
  onNext,
  className,
}: LightboxNavigationProps) {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalFiles - 1;

  if (totalFiles <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={onPrevious}
        disabled={!hasPrevious}
        variant="icon_v2"
        size="icon_v2"
        className="bg-background/80 hover:bg-hover backdrop-blur-sm"
        aria-label="Previous file"
      >
        <ChevronLeft className="w-5 h-5 stroke-icon" />
      </Button>
      <div className="text-sm text-primary px-2 bg-background/80 backdrop-blur-sm rounded-sm py-1">
        {currentIndex + 1} / {totalFiles}
      </div>
      <Button
        onClick={onNext}
        disabled={!hasNext}
        variant="icon_v2"
        size="icon_v2"
        className="bg-background/80 hover:bg-hover backdrop-blur-sm"
        aria-label="Next file"
      >
        <ChevronRight className="w-5 h-5 stroke-icon" />
      </Button>
    </div>
  );
}
