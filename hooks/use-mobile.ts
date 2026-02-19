import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", checkIsMobile);
    window.addEventListener("resize", checkIsMobile);
    checkIsMobile();
    return () => {
      mql.removeEventListener("change", checkIsMobile);
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return !!isMobile;
}
