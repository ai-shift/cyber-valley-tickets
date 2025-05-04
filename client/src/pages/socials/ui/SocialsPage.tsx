import { SocialsForm } from "@/features/socials-form";

export const SocialsPage: React.FC = () => {
  function handleSubmit() {
    console.log("foo");
  }
  return <SocialsForm onSumbit={handleSubmit} />;
};
