"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

type ChatLayoutContextValue = {
  headerActionsRef: RefObject<HTMLDivElement | null>;
};

const ChatLayoutContext = createContext<ChatLayoutContextValue | undefined>(
  undefined,
);

export function ChatLayoutProvider({ children }: { children: ReactNode }) {
  const headerActionsRef = useRef<HTMLDivElement | null>(null);

  const value = useMemo(() => ({ headerActionsRef }), []);

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
