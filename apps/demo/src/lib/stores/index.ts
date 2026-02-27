import { create } from "zustand";
import { ReactNode } from "react";

export * from "../zustand/useViewStore";

type User = {
  user_id: string;
  company_id: string;
  organization_id: string;
  name: string;
  email: string;
};

type UserState = {
  user: User;
  setUser: (value: Partial<User>) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: {
    user_id: "demo-user",
    company_id: "demo-company",
    organization_id: "demo-organization",
    name: "Demo User",
    email: "demo@example.com",
  },
  setUser(value) {
    set((state) => ({
      user: {
        ...state.user,
        ...value,
      },
    }));
  },
}));

type BackButtonState = {
  backLink?: string;
  setBackLink: (href?: string) => void;
  clear: () => void;
};

export const useBackButtonStore = create<BackButtonState>((set) => ({
  backLink: undefined,
  setBackLink(href) {
    set({ backLink: href });
  },
  clear() {
    set({ backLink: undefined });
  },
}));

export type HeaderAction = {
  id?: string;
  label?: string;
  icon?: ReactNode;
  variant?: string;
  size?: string;
  onClick?: () => void;
};

type ContentState = {
  title?: string;
  subtitle?: string;
  headerActions?: HeaderAction[];
  titleIcon?: ReactNode;
  setHeaderActions: (actions: HeaderAction[]) => void;
  setTitle: (value: string | undefined) => void;
  setSubtitle: (value: string | undefined) => void;
  setTitleIcon: (icon: ReactNode | undefined) => void;
  clear: () => void;
};

export const useContentStore = create<ContentState>((set) => ({
  title: undefined,
  subtitle: undefined,
  headerActions: [],
  titleIcon: undefined,
  setHeaderActions(actions) {
    set({ headerActions: actions });
  },
  setTitle(value) {
    set({ title: value });
  },
  setSubtitle(value) {
    set({ subtitle: value });
  },
  setTitleIcon(icon) {
    set({ titleIcon: icon });
  },
  clear() {
    set({
      title: undefined,
      subtitle: undefined,
      headerActions: [],
      titleIcon: undefined,
    });
  },
}));
