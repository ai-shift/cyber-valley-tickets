import { PageContainer } from "@/shared/ui/PageContainer";

export const Page404: React.FC = () => {
  return (
    <PageContainer name="Not found">
      <div className="aspect-square flex flex-col items-center justify-center">
        <h2 className="glitch text-8xl">404</h2>
        <p className="text-3xl">Page not found</p>
      </div>
    </PageContainer>
  );
};
