import { create } from "zustand";

type DisplaySettings = Record<string, Record<string, unknown>>;

type ViewState = {
  view: {
    display_settings: DisplaySettings;
    sidebarRoute: string | null;
  };
  setDisplaySetting: (context: string, key: string, value: unknown) => void;
  getDisplaySetting: (context: string, key: string) => unknown;
  resetDisplaySettings: (context: string) => void;
  setSidebarRoute: (route: string | null) => void;
};

export const useViewStore = create<ViewState>((set, get) => ({
  view: {
    display_settings: {},
    sidebarRoute: null,
  },
  setDisplaySetting(context, key, value) {
    set((state) => {
      const current = state.view.display_settings[context] || {};
      return {
        view: {
          ...state.view,
          display_settings: {
            ...state.view.display_settings,
            [context]: {
              ...current,
              [key]: value,
            },
          },
        },
      };
    });
  },
  getDisplaySetting(context, key) {
    return get().view.display_settings[context]?.[key];
  },
  resetDisplaySettings(context) {
    set((state) => ({
      view: {
        ...state.view,
        display_settings: {
          ...state.view.display_settings,
          [context]: {},
        },
      },
    }));
  },
  setSidebarRoute(route) {
    set((state) => ({
      view: {
        ...state.view,
        sidebarRoute: route,
      },
    }));
  },
}));
