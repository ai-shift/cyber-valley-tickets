import { useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { useExpandableContext } from "../context/ExpandableContext";

type ExpandableContentProps = {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
};

export const ExpandableContent: React.FC<ExpandableContentProps> = ({
  children,
  className,
  wrapperClassName,
}) => {
  const {
    isInsideContext,
    contentRef,
    triggerRef,
    isCurrentExpanded,
    axle,
    contentAbsolute,
  } = useExpandableContext();

  if (!isInsideContext)
    throw new Error("'ExpandableContent' has to be inside 'Expandable'");

  useEffect(() => {
    const triggerEl = triggerRef?.current;
    const contentEl = contentRef?.current;

    if (!triggerEl || !contentEl) return;

    const height = contentEl.scrollHeight;
    const width = contentEl.scrollWidth;

    const contentBefore =
      contentEl.compareDocumentPosition(triggerEl) ===
      Node.DOCUMENT_POSITION_FOLLOWING;

    switch (axle) {
      case "vertical":
        contentEl.style.height = isCurrentExpanded ? `${height}px` : "0px";
        if (contentBefore) {
          contentEl.style.bottom = "100%";
        } else {
          contentEl.style.top = "100%";
        }
        break;
      case "horisontal":
        contentEl.style.width = isCurrentExpanded ? `${width}px` : "0px";
        if (contentBefore) {
          contentEl.style.left = "100%";
        } else {
          contentEl.style.right = "100%";
        }
        break;
      default:
        break;
    }
  }, [isCurrentExpanded, triggerRef.current, contentRef.current, axle]);

  return (
    <div
      className={twMerge(
        !isCurrentExpanded && axle === "vertical" && "h-0",
        !isCurrentExpanded && axle === "horisontal" && "w-0",
        "overflow-hidden transition-all duration-300 flex-1",
        contentAbsolute && "absolute",
        wrapperClassName,
      )}
      ref={contentRef}
    >
      <div className={className}>{children}</div>
    </div>
  );
};
