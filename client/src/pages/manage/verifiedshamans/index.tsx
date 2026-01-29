import { VerifiedShamansList } from "@/features/verified-shamans-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useSearchParams } from "react-router";

export const ManageVerifiedShamansPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  return (
    <PageContainer name="Manage verified shamans">
      <section className=" px-5 py-9">
        <div className="flex flex-col gap-4">
          <SearchBar placeholder="Search verified shamans by address or socials..." />
          <VerifiedShamansList searchQuery={searchQuery} />
        </div>
      </section>
    </PageContainer>
  );
};
