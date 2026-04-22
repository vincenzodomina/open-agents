"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type ChatLayoutContextValue = {
  shareRequested: boolean;
  setShareRequested: (requested: boolean) => void;
  headerActionsRef: RefObject<HTMLDivElement | null>;
};

const ChatLayoutContext = createContext<ChatLayoutContextValue | undefined>(
  undefined,
);

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
  const [shareRequested, setShareRequested] = useState(false);
  const headerActionsRef = useRef<HTMLDivElement | null>(null);

  const value = useMemo(
    () => ({
      shareRequested,
      setShareRequested,
      headerActionsRef,
    }),
    [shareRequested],
  );

  return (
    <ChatLayoutContext.Provider value={value}>
      {children}
    </ChatLayoutContext.Provider>
  );
}

export function useChatLayout() {
  const context = useContext(ChatLayoutContext);
  if (!context) {
    throw new Error("useChatLayout must be used within a ChatLayoutProvider");
  }
  return context;
}
