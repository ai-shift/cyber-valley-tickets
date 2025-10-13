import { SocialsForm } from "@/features/socials-form";
import { PageContainer } from "@/shared/ui/PageContainer";
import { Socials } from "@/entities/socials";
import { useAuthSlice } from "@/app/providers";

export const SocialsPage: React.FC = () => {
  const {user} = useAuthSlice()

  function handleSubmit(socials: Socials) {
    // FIXME: ADD fetch call when ready
    console.log(socials)
  }

  return (
    <PageContainer name="Socials">
      <SocialsForm onSubmit={handleSubmit} existingSocials={user.socials} />
    </PageContainer>
  );
};
