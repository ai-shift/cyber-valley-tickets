import { VerificationStatsTable } from "@/features/verification-stats";
import { PageContainer } from "@/shared/ui/PageContainer";

export const ManageVerificationStatsPage: React.FC = () => {
  return (
    <PageContainer name="Verification Statistics">
      <section className="px-5 py-9">
        <p className="text-gray-400 mb-4">
          Compare verification statistics between current and previous week for
          events, places, and shamans.
        </p>
        <VerificationStatsTable />
      </section>
    </PageContainer>
  );
};
