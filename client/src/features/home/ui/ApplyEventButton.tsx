import { useAuthSlice } from "@/app/providers";
import { Button } from "@/shared/ui/button";

export const ApplyEventButton = () => {
  const { user } = useAuthSlice();

  if (user == null) {
    return null;
  }

  function handleApplyEventPlace() {
    window.open(
      `https://t.me/cyberia_tickets_bot?start=${user!.address}_verifyshaman`,
      "_blank",
    );
  }

  return (
    !["localprovider", "verifiedshaman", "master"].includes(user.role) && (
      <div className="w-full sticky bottom-1 pt-3">
        <Button
          onClick={handleApplyEventPlace}
          filling="outline"
          className="w-full"
        >
          Apply new event space
        </Button>
      </div>
    )
  );
};
