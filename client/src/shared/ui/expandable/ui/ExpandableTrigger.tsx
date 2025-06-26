import { twMerge } from "tailwind-merge";
import { useExpandableContext } from "../context/ExpandableContext";

type ButtonPropsWithoutChildren = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children"
>;

type ExpandableTriggerProps = ButtonPropsWithoutChildren & {
  children:
    | React.ReactNode
    | ((data: { isCurrentExpanded: boolean }) => React.ReactNode);
  withToggle?: boolean;
  className?: string;
};

export const ExpandableTrigger: React.FC<ExpandableTriggerProps> = ({
  children,
  withToggle = false,
  className,
  ...props
}) => {
  const { toggleCurrentExpanded, isCurrentExpanded, triggerRef } =
    useExpandableContext();

  return (
    <button
      type="button"
      className={twMerge("block mx-auto", className)}
      ref={triggerRef}
      onClick={toggleCurrentExpanded}
      {...props}
    >
      {typeof children === "function"
        ? children({ isCurrentExpanded })
        : children}
    </button>
  );
};
