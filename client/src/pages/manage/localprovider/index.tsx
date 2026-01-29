import { LocalproviderForm } from "@/features/localprovider-form/ui/LocalproviderForm";
import { LocalproviderList } from "@/features/localprovider-list/ui/LocalproviderList";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";

const SEARCH_PARAM_NAME = "search";

export const ManageLocalprovidersPage: React.FC = () => {
  return (
    <PageContainer name="Manage local providers">
      <section className=" px-5 py-9">
        <LocalproviderForm />
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar
            paramName={SEARCH_PARAM_NAME}
            placeholder="Search local providers by address or socials..."
          />
          <LocalproviderList searchParamName={SEARCH_PARAM_NAME} />
        </div>
      </section>
    </PageContainer>
  );
};
