import { PlacesList } from "@/features/places-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router";

const SEARCH_PARAM_NAME = "search";

export const ManagePlacesPage: React.FC = () => {
  return (
    <PageContainer name="Manage places">
      <section className=" px-5 py-9">
        <Link className="block" to="/manage/place/create">
          <Button className="block w-full">Create place</Button>
        </Link>
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar
            paramName={SEARCH_PARAM_NAME}
            placeholder="Search places by name or provider..."
          />
          <PlacesList searchParamName={SEARCH_PARAM_NAME} />
        </div>
      </section>
    </PageContainer>
  );
};
