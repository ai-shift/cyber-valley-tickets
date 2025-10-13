import { LocalproviderForm } from "@/features/localprovider-form/ui/LocalproviderForm";
import { LocalproviderList } from "@/features/localprovider-list/ui/LocalproviderList";
import { PageContainer } from "@/shared/ui/PageContainer";

export const ManageLocalprovidersPage: React.FC = () => {
  console.log("KEKE");
  return (
    <PageContainer name="Manage local providers">
      <section className=" px-5 py-9">
        <LocalproviderForm />
        <LocalproviderList />
      </section>
    </PageContainer>
  );
};
