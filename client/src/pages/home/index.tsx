import { Home } from "@/features/home";
import { useShowFormNav } from "@/shared/widgets/navigation/hooks/useShowFormNav";

export const HomePage: React.FC = () => {
  useShowFormNav();
  return <Home />;
};
