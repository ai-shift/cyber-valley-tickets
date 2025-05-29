import animationData from "@/lotties/vagina.json";
import Lottie from "lottie-react";

export const Success: React.FC = () => {
  return (
    <div className="aspect-square h-40 mx-auto my-7">
      <Lottie animationData={animationData} />
    </div>
  );
};
