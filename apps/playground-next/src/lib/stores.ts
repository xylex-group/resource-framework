import { create } from "zustand";

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
    user_id: process.env.NEXT_PUBLIC_ATHENA_USER_ID ?? "playground-user",
    company_id: process.env.NEXT_PUBLIC_ATHENA_COMPANY_ID ?? "playground-company",
    organization_id:
      process.env.NEXT_PUBLIC_ATHENA_ORGANIZATION_ID ?? "playground-org",
    name: "Athena Playground",
    email: "playground@xylex.group",
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
