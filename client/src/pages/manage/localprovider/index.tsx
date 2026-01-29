import { LocalproviderForm } from "@/features/localprovider-form/ui/LocalproviderForm";
import { LocalproviderList } from "@/features/localprovider-list/ui/LocalproviderList";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useSearchParams } from "react-router";

export const ManageLocalprovidersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  return (
    <PageContainer name="Manage local providers">
      <section className=" px-5 py-9">
        <LocalproviderForm />
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar placeholder="Search local providers by address or socials..." />
          <LocalproviderList searchQuery={searchQuery} />
        </div>
      </section>
    </PageContainer>
  );
};
