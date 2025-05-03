import { PageContainer } from "@/shared/ui/PageContainer";
import { Navigate, useParams } from "react-router";

export const EditEventPage: React.FC = () => {
  const { eventId } = useParams();

  if (eventId === undefined) return <Navigate to={"/events"} />;

  return <PageContainer name="Edit page"> </PageContainer>;
};
