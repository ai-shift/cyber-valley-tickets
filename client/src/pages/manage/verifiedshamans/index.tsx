import { VerifiedShamansList } from "@/features/verified-shamans-list";
import { PageContainer } from "@/shared/ui/PageContainer";

export const ManageVerifiedShamansPage: React.FC = () => {
  return (
    <PageContainer name="Manage verified shamans">
      <section className=" px-5 py-9">
        <VerifiedShamansList />
      </section>
    </PageContainer>
  );
};
