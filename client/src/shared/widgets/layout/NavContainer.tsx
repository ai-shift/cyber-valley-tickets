import { Button } from "@/shared/ui/button";
import { Outlet, useLocation } from "react-router";
import { Nav } from "../navigation";

export const NavContainer: React.FC = () => {
  const { pathname } = useLocation();
  const isHomePage = pathname === "/";

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="overflow-y-auto flex-1 ">
        <Outlet />
      </div>
      <div className="relative">
        {isHomePage && (
          <div className="absolute bottom-full left-0 right-0 pb-2 px-3 bg-black">
            <Button
              asChild
              variant="ghost"
              className="w-full bg-black border-secondary text-secondary clip-corners hover:bg-secondary hover:text-black"
            >
              <a
                href="https://t.me/+ELgY3iRp1-RkYWMy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply new event space
              </a>
            </Button>
          </div>
        )}
        <Nav className="bg-background bottom-0 left-0 right-0 p-2 rounded-b-3xl" />
      </div>
    </div>
  );
};
