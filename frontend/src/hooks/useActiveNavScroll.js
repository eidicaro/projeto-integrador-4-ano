import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/** Keep the current section visible inside horizontally scrollable navigation. */
export default function useActiveNavScroll() {
  const navRef = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector('[aria-current="page"]');
    if (!active || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft +=
      active.getBoundingClientRect().left -
      nav.getBoundingClientRect().left -
      (nav.clientWidth - active.clientWidth) / 2;
  }, [pathname]);
  return navRef;
}
