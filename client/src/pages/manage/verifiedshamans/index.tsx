import { VerifiedShamansList } from "@/features/verified-shamans-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";

const SEARCH_PARAM_NAME = "search";

export const ManageVerifiedShamansPage: React.FC = () => {
  return (
    <PageContainer name="Manage verified shamans">
      <section className=" px-5 py-9">
        <div className="flex flex-col gap-4">
          <SearchBar
            paramName={SEARCH_PARAM_NAME}
            placeholder="Search verified shamans by address or socials..."
          />
          <VerifiedShamansList searchParamName={SEARCH_PARAM_NAME} />
        </div>
      </section>
    </PageContainer>
  );
};
