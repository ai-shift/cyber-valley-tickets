import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/Tabs";
import { CompanyForm } from "./CompanyForm";
import { IndividualForm } from "./IndividualForm";

export const ShamanVerification: React.FC = () => {
  return (
    <Tabs defaultValue="individual">
      <TabsList className="py-3">
        <TabsTrigger
          className="border-2 border-black/0 p-2 text-xl font-bold uppercase"
          activeClassName=" border-primary"
          value="individual"
        >
          Individual
        </TabsTrigger>
        <TabsTrigger
          className="border-2 border-black/0 p-2 text-xl font-bold uppercase"
          activeClassName="border-primary"
          value="company"
        >
          Legal entity
        </TabsTrigger>
      </TabsList>
      <div className="py-5 px-10">
        <TabsContent value="individual">
          <IndividualForm />
        </TabsContent>
        <TabsContent value="company">
          <CompanyForm />
        </TabsContent>
      </div>
    </Tabs>
  );
};
