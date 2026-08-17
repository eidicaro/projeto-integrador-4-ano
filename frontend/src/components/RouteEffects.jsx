import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RouteEffects() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document
          .getElementById(decodeURIComponent(hash.slice(1)))
          ?.scrollIntoView({ block: "start" });
      } else {
        window.scrollTo({ top: 0, left: 0 });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);

  return null;
}
