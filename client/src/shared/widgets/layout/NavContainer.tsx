import { Outlet } from "react-router";
import { Nav } from "../navigation";
import { FormNav } from "../navigation/ui/FormNav";

export const NavContainer: React.FC = () => {
  return (
    <div className="h-full relative flex flex-col justify-between">
      <div className="overflow-y-auto flex-1 ">
        <Outlet />
      </div>
      <div className="absolute z-100 right-5 bottom-20">
        <FormNav />
      </div>
      <div className="relative">
        <Nav className="bg-background bottom-0 left-0 right-0 p-2 rounded-b-3xl" />
      </div>
    </div>
  );
};
