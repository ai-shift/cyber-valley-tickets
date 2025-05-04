import { useNavigate, Navigate } from "react-router";

import { type Socials, useOrderStore } from "@/entities/order";
import { SocialsForm } from "@/features/socials-form";
import { PageContainer } from "@/shared/ui/PageContainer";

export const SocialsPage: React.FC = () => {
  const navigate = useNavigate();
  const { order, setSocials } = useOrderStore();

  if (!order?.type) return <Navigate to="/events" />;

  function handleSubmit(socials: Socials) {
    setSocials(socials);
    navigate("/purchase");
  }
  return (
    <PageContainer name="Socials">
      <SocialsForm onSumbit={handleSubmit} />
    </PageContainer>
  );
};
