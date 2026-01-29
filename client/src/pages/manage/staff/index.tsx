import { StaffForm } from "@/features/staff-form";
import { StaffList } from "@/features/staff-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";
import { useSearchParams } from "react-router";

export const ManageStaffPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || undefined;

  return (
    <PageContainer name="Manage staff">
      <section className=" px-5 py-9">
        <StaffForm />
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar placeholder="Search staff by address or socials..." />
          <StaffList searchQuery={searchQuery} />
        </div>
      </section>
    </PageContainer>
  );
};
