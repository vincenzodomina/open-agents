"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type WorkspacePanelContextValue = {
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  panelPortalRef: RefObject<HTMLDivElement | null>;
};

const WorkspacePanelContext = createContext<
  WorkspacePanelContextValue | undefined
>(undefined);

export function WorkspacePanelProvider({ children }: { children: ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelPortalRef = useRef<HTMLDivElement | null>(null);

  const togglePanel = useCallback(() => {
    setPanelOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      panelOpen,
      setPanelOpen,
      togglePanel,
      panelPortalRef,
    }),
    [panelOpen, togglePanel],
  );

  return (
    <WorkspacePanelContext.Provider value={value}>
      {children}
    </WorkspacePanelContext.Provider>
  );
}

export function useWorkspacePanel() {
  const context = useContext(WorkspacePanelContext);
  if (!context) {
    throw new Error(
      "useWorkspacePanel must be used within a WorkspacePanelProvider",
    );
  }
  return context;
}
