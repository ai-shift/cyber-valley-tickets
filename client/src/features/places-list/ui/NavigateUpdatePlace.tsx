import type { EventPlace } from "@/entities/place";
import { useNavigate } from "react-router";

type NavigateUpdatePlaceProps = {
  place: EventPlace;
};

export const NavigateUpdatePlace: React.FC<NavigateUpdatePlaceProps> = ({
  place,
}) => {
  const navigate = useNavigate();

  function havigateHandler() {
    navigate("/manage/place/update", { state: place });
  }

  return (
    <button
      className="h-full cursor-pointer"
      type="button"
      onClick={havigateHandler}
    >
      <img className="h-full" src="/icons/manage_4.svg" alt="edit_button" />
    </button>
  );
};
