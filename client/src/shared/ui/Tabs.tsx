import { createContext, use, useState } from "react";
import { twMerge } from "tailwind-merge";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext({} as TabsContextType);
const useTabs = () => use(TabsContext);

type TabsProps = {
  children: React.ReactNode;
  defaultValue: string;
};

const Tabs: React.FC<TabsProps> = ({ children, defaultValue }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div
      className={twMerge("flex justify-center items-center gap-5", className)}
    >
      {children}
    </div>
  );
};

type TabsTriggerProps = {
  value: string;
  children: string;
  className?: string;
  activeClassName?: string;
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  children,
  className,
  activeClassName,
  value,
}) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      className={twMerge(className, isActive && activeClassName)}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
};

const TabsContent: React.FC<TabsContentProps> = ({ value, children }) => {
  const { activeTab } = useTabs();

  if (activeTab === value) {
    return <>{children}</>;
  }

  return null;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
