import { StaffForm } from "@/features/staff-form";
import { StaffList } from "@/features/staff-list";
import { PageContainer } from "@/shared/ui/PageContainer";
import { SearchBar } from "@/shared/ui/SearchBar";

const SEARCH_PARAM_NAME = "search";

export const ManageStaffPage: React.FC = () => {
  return (
    <PageContainer name="Manage staff">
      <section className=" px-5 py-9">
        <StaffForm />
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar
            paramName={SEARCH_PARAM_NAME}
            placeholder="Search staff by address or socials..."
          />
          <StaffList searchParamName={SEARCH_PARAM_NAME} />
        </div>
      </section>
    </PageContainer>
  );
};
