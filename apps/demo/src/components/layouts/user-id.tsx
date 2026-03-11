"use client";

import { cn } from "@/lib/utils";

type UserIdProps = {
  user_id?: string;
  email?: string;
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  variant?: "default" | "avatar-only";
  avatarClassName?: string;
};

function getDisplayName(props: UserIdProps) {
  if (props.display_name) return props.display_name;
  const fullName = [props.first_name, props.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (props.username) return props.username;
  if (props.email) return props.email;
  if (props.user_id) return props.user_id;
  return "User";
}

export default function UserId(props: UserIdProps) {
  const displayName = getDisplayName(props);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground",
          props.avatarClassName,
        )}
        title={displayName}
      >
        {initials}
      </div>
      {props.variant !== "avatar-only" && (
        <span className="text-sm text-primary">{displayName}</span>
      )}
    </div>
  );
}
