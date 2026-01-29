import { PlacesList } from "@/features/places-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Button } from "@/shared/ui/button";
import { Link, useSearchParams } from "react-router";

export const ManagePlacesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  return (
    <PageContainer name="Manage places">
      <section className=" px-5 py-9">
        <Link className="block" to="/manage/place/create">
          <Button className="block w-full">Create place</Button>
        </Link>
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar placeholder="Search places by name or provider..." />
          <PlacesList searchQuery={searchQuery} />
        </div>
      </section>
    </PageContainer>
  );
};
