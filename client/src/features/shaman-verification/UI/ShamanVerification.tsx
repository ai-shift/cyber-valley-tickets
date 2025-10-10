import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/Tabs";
import { CompanyForm } from "./CompanyForm";
import { IndividualForm } from "./IndividualForm";

export const ShamanVerification: React.FC = () => {
  return (
    <Tabs defaultValue="individual">
      <TabsList className="py-3 flex-wrap">
        <TabsTrigger
          className="text-xl font-bold uppercase"
          activeClassName="underline underline-offset-2"
          value="individual"
        >
          Individual
        </TabsTrigger>
        <TabsTrigger
          className="text-xl font-bold uppercase"
          activeClassName="underline underline-offset-2"
          value="company"
        >
          Legal entity / company
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
