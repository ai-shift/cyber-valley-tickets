import { Calendar, LandPlot, PlusIcon } from "lucide-react";

import { useState } from "react";
import { NavLink } from "react-router";

const formRoutes = [
  {
    path: "/events/create",
    title: "Event",
    icon: Calendar,
  },
  {
    path: "/manage/place/create",
    title: "Place",
    icon: LandPlot,
  },
];

export const FormNav = () => {
  const [open, setOpen] = useState(false);

  function toggleOpen() {
    setOpen((open) => !open);
  }

  return (
    <div className="relative">
      <div
        className={`absolute bottom-20 right-0 flex flex-col gap-3 items-end transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 animate-in fade-in-0 zoom-in-95"
            : "opacity-0 translate-y-4 animate-out fade-out-0 zoom-out-95 pointer-events-none"
        }`}
      >
        {formRoutes.map((route) => {
          const IconComponent = route.icon;
          return (
            <NavLink
              to={route.path}
              key={route.path}
              onClick={toggleOpen}
              className="flex items-center gap-3 group"
            >
              <span className="text-primary text-lg font-medium">
                {route.title}
              </span>
              <div className="card h-12 border-primary/50 aspect-square flex justify-center items-center shadow-lg transition-colors">
                <IconComponent className="text-white size-5" />
              </div>
            </NavLink>
          );
        })}
      </div>
      <button
        type="button"
        className="card h-14 aspect-square flex justify-center items-center shadow-lg transition-colors"
        onClick={toggleOpen}
      >
        <PlusIcon
          className={`stroke-white size-8 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>
    </div>
  );
};
