import { Outlet } from "react-router";
import { Nav } from "../navigation";
import { useNavStore } from "../navigation/model/navSlice";
import { FormNav } from "../navigation/ui/FormNav";
import { useLayoutEffect, useRef } from "react";

export const NavContainer: React.FC = () => {
  const isFormNavVisible = useNavStore((state) => state.isFormNavVisible);
  const navRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const setVar = () => {
      const h = el.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--app-tabbar-h", `${h}px`);
    };

    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener("resize", setVar);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, []);

  return (
    <div className="h-full relative flex flex-col justify-between">
      <div className="overflow-y-auto flex-1">
        <Outlet />
      </div>
      {isFormNavVisible && (
        <div className="absolute z-100 right-5 bottom-20">
          <FormNav />
        </div>
      )}
      <div ref={navRef} className="relative">
        <Nav className="bg-background bottom-0 left-0 right-0 p-2 rounded-b-3xl" />
      </div>
    </div>
  );
};
