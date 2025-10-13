import { useState } from "react";
import { useNavigate } from "react-router";

import { useAuthSlice } from "@/app/providers";
import { upsertSocials, type Socials } from "@/entities/socials";
import { SocialsForm } from "@/features/socials-form";
import { PageContainer } from "@/shared/ui/PageContainer";

export const SocialsPage: React.FC = () => {
  const { user } = useAuthSlice();
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  if (!user) return;

  async function handleSubmit(socials: Socials) {
    setError(false)
    const {response} = await upsertSocials(socials);
    if (!response.ok) {
      setError(true)
      console.error("Failed to set socials")
    }
    navigate(-1)
  }

  return (
    <PageContainer name="Socials">
      <SocialsForm onSubmit={handleSubmit} existingSocials={user.socials[0]} />
      {error && <p className="text-center py-6 text-lg text-red-500">Some problem occured while setting socials. <br/> Try again.</p>}
    </PageContainer>
  );
};
