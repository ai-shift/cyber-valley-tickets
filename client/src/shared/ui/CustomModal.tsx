import type React from "react";
import {
  type ReactElement,
  cloneElement,
  createContext,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

const ModalContext = createContext(
  {} as {
    open: boolean;
    onModalChange: (open: boolean) => void;
  },
);

type ModalProps = {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
};

export const CustomModal: React.FC<ModalProps> = ({
  children,
  open: propOpen,
  setOpen: propSetOpen,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpenControlled = propOpen !== undefined && propSetOpen !== undefined;
  const open = isOpenControlled ? propOpen : internalOpen;
  const setOpen = isOpenControlled ? propSetOpen : setInternalOpen;

  function onModalChange(open: boolean) {
    setOpen(open);
  }

  return (
    <ModalContext.Provider value={{ open, onModalChange }}>
      {children}
    </ModalContext.Provider>
  );
};

type WindowProps = {
  children: React.ReactNode;
  className?: string;
};

export const CustomModalWindow: React.FC<WindowProps> = ({
  children,
  className,
}) => {
  const { open } = useContext(ModalContext);

  if (!open) return null;

  return createPortal(
    <div className="fixed top-0 left-0 w-full h-screen bg-black/50 z-40 transition-all duration-500">
      <div
        className={cn(
          "fixed top-[50%] left-[50%] -translate-y-[50%] -translate-x-[50%] bg-background border-white py-8 px-8 border-[1px] w-[95%]  sm:max-w-1/2 lg:max-w-1/3 transition-all duration-500",
          className,
        )}
      >
        <div>{cloneElement(children as ReactElement)}</div>
      </div>
    </div>,
    document.body,
  );
};
