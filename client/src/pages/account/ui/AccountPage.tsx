import { useUser } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Link } from "react-router";

export const AccountPage: React.FC = () => {
  const { user } = useUser();

  if (!user) return <p>Feels bad, man</p>;

  return (
    <PageContainer name="Account">
      <div className="flex flex-col items-center gap-10">
        <div className="py-10 flex gap-20 items-center">
          <img
            className="rounded-full h-24"
            src="https://images.stockcake.com/public/8/c/4/8c46406b-e635-4ad7-9d39-5b4591616202/cyberpunk-city-avatar-stockcake.jpg"
            alt="User"
          />
          <p>{user.address.slice(0, 16)}...</p>
        </div>
        <Link to="/account/my-events">My events</Link>
        <Button>Logout</Button>
      </div>
    </PageContainer>
  );
};
