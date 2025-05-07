import { Outlet } from "react-router";
import { Nav } from "../navigation";

export const NavContainer: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="overflow-y-auto flex-1 ">
        <Outlet />
      </div>
      <Nav className="bg-background bottom-0 left-0 right-0 p-2 rounded-b-3xl" />
    </div>
  );
};
