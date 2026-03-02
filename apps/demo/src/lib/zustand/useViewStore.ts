import { create } from "zustand";

type DisplaySettings = Record<string, Record<string, unknown>>;

type DisplayOptionValue = string | number | boolean;

export type DisplayConfigOption = {
  type?: "toggle" | "group" | "rows_per_page" | "sort" | string;
  label: string;
  value: string;
  defaultValue?: DisplayOptionValue;
  options?: Array<{ label: string; value: string }>;
};

type StylingState = {
  tables_extra_side_padding?: boolean;
};

type ViewState = {
  view: {
    display_settings: DisplaySettings;
    sidebarRoute: string | null;
    isInLightbox: boolean;
    isInPopover: boolean;
    isInUserPopover: boolean;
    styling: StylingState;
    debug_mode?: boolean;
  };
  setDisplaySetting: (context: string, key: string, value: unknown) => void;
  getDisplaySetting: (context: string, key: string) => unknown;
  resetDisplaySettings: (context: string) => void;
  setSidebarRoute: (route: string | null) => void;
  setIsInLightbox: (value: boolean) => void;
  setIsInPopover: (value: boolean) => void;
  setIsInUserPopover: (value: boolean) => void;
  setDebugMode: (value: boolean) => void;
  setStyling: (styling: StylingState) => void;
};

export const useViewStore = create<ViewState>((set, get) => ({
  view: {
    display_settings: {},
    sidebarRoute: null,
    isInLightbox: false,
    isInPopover: false,
    isInUserPopover: false,
    styling: { tables_extra_side_padding: false },
    debug_mode: false,
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
  setIsInLightbox(value) {
    set((state) => ({
      view: {
        ...state.view,
        isInLightbox: value,
      },
    }));
  },
  setIsInPopover(value) {
    set((state) => ({
      view: {
        ...state.view,
        isInPopover: value,
      },
    }));
  },
  setIsInUserPopover(value) {
    set((state) => ({
      view: {
        ...state.view,
        isInUserPopover: value,
      },
    }));
  },
  setDebugMode(value) {
    set((state) => ({
      view: {
        ...state.view,
        debug_mode: value,
      },
    }));
  },
  setStyling(styling) {
    set((state) => ({
      view: {
        ...state.view,
        styling: {
          ...state.view.styling,
          ...styling,
        },
      },
    }));
  },
}));
