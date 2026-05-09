import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    const scrollNow = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById("root");
      if (root) root.scrollTop = 0;
    };
    scrollNow();
    requestAnimationFrame(scrollNow);
    setTimeout(scrollNow, 50);
  }, [pathname]);

  return null;
}
