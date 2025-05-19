import { PlacesList } from "@/features/places-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";

export const ManagePlacesPage: React.FC = () => {
  return (
    <PageContainer name="Manage places">
      <section className=" px-5 py-9">
        <Link className="block" to="/manage/place/create">
          <Button className="block w-full">Create place</Button>
        </Link>
        <PlacesList />
      </section>
    </PageContainer>
  );
};
