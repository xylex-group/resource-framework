"use client";

import { createContext, useContext } from "react";

export const LightboxScrollContext = createContext<{
  setHasScrolled: (scrolled: boolean) => void;
}>({
  setHasScrolled: () => {},
});

export const useLightboxScroll = () => useContext(LightboxScrollContext);
