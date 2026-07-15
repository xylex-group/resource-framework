"use client";

import React, { FC } from "react";
import { Popover } from "@heroui/react";
import UserId from "@/components/layouts/user-id";
import type { Assignee } from "../../resource-types";

export const AssigneesCell: FC<{ assignees?: Assignee[] }> = ({
  assignees,
}) => {
  const list = Array.isArray(assignees)
    ? assignees.filter(Boolean).slice()
    : [];
  if (!list.length) return null;

  const visible = list.slice(0, 2);
  const overflow = list.slice(2);

  return (
    <div className="flex items-center gap-2">
      {visible.map((a, idx) => (
        <div
          key={(a.user_id || a.email || a.username || String(idx)) +
            "_assignee"}
        >
          <UserId
            user_id={a.user_id}
            email={a.email}
            username={a.username}
            display_name={a.display_name}
            avatar={a.avatar}
            first_name={a.first_name}
            last_name={a.last_name}
            variant="avatar-only"
            avatarClassName="h-7 w-7"
          />
        </div>
      ))}
      {overflow.length > 0 && (
        <Popover>
          <Popover.Trigger>
            <div className="flex h-7 min-w-7 items-center justify-center rounded-sm bg-muted px-1.5 text-xs text-primary">
              +{overflow.length}
            </div>
          </Popover.Trigger>
          <Popover.Content
            className="w-65 rounded-sm bg-card"
            placement="bottom start"
          >
            <Popover.Dialog>
              <div className="flex flex-col gap-3">
                {overflow.map((a, idx) => (
                  <div
                    key={(a.user_id || a.email || a.username || String(idx)) +
                      "_overflow"}
                    className="flex items-center gap-2"
                  >
                    <UserId
                      user_id={a.user_id}
                      email={a.email}
                      username={a.username}
                      display_name={a.display_name}
                      avatar={a.avatar}
                      first_name={a.first_name}
                      last_name={a.last_name}
                      variant="default"
                    />
                  </div>
                ))}
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      )}
    </div>
  );
};
