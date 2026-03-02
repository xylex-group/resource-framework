import { Dispatch, SetStateAction } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToggleEditProps {
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  isSaving?: boolean;
  onSave?: () => void;
  pendingChanges?: number;
}

export function ToggleEdit({
  isEditing,
  setIsEditing,
  isSaving = false,
  onSave: _onSave,
  pendingChanges: _pendingChanges = 0,
}: ToggleEditProps) {
  const handleClick = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setIsEditing((v) => !v);
    }
  };

  return (
    <div
      id="resource-drilldown-toggle-edit"
      className="flex items-center gap-2"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isSaving}
      >
        {isEditing
          ? <X className="stroke-icon h-5 w-5" />
          : <Pencil className="stroke-icon h-5 w-5" />}
      </Button>
    </div>
  );
}
