"use client";

import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  type SessionChatListItem,
  useSessionChats,
} from "@/hooks/use-session-chats";
import type { Session } from "@/lib/db/schema";
import { SessionHeader } from "./chats/[chatId]/session-header";
import { ChatTabs } from "./chats/[chatId]/chat-tabs";
import {
  WorkspacePanelProvider,
  useWorkspacePanel,
} from "./chats/[chatId]/workspace-panel-context";
import { SessionLayoutContext } from "./session-layout-context";

type SessionLayoutShellProps = {
  session: Session;
  initialChatsData?: {
    defaultModelId: string | null;
    chats: SessionChatListItem[];
  };
  children: ReactNode;
};

function SessionLayoutInner({
  activeChatId,
  children,
}: {
  activeChatId: string;
  children: ReactNode;
}) {
  const { panelPortalRef, panelOpen, setPanelOpen } = useWorkspacePanel();

  return (
    <div className="relative flex h-full overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SessionHeader />
        {activeChatId && <ChatTabs activeChatId={activeChatId} />}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>

      {panelOpen && (
        <button
          type="button"
          aria-label="Close right sidebar"
          className="absolute inset-0 z-20 bg-background/20 sm:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}

      <div
        ref={panelPortalRef}
        className={`absolute right-0 top-0 z-30 flex h-full w-72 flex-col overflow-hidden border-l border-border bg-background shadow-lg transition-transform duration-200 ease-in-out sm:relative sm:right-auto sm:top-auto sm:z-0 sm:shrink-0 sm:translate-x-0 sm:shadow-none sm:transition-[width] ${
          panelOpen
            ? "translate-x-0 sm:w-72 sm:border-l xl:w-80"
            : "translate-x-full sm:w-0 sm:border-l-0"
        }`}
      />
    </div>
  );
}

export function SessionLayoutShell({
  session: initialSession,
  initialChatsData,
  children,
}: SessionLayoutShellProps) {
  const router = useRouter();
  const params = useParams<{ chatId?: string }>();
  const routeChatId = params.chatId ?? "";
  const [optimisticActiveChatId, setOptimisticActiveChatId] = useState<
    string | null
  >(null);
  const [_isNavigatingChat, startChatNavigationTransition] = useTransition();
  const prefetchedChatHrefsRef = useRef(new Set<string>());

  const sessionId = initialSession.id;

  const {
    chats,
    loading: chatsLoading,
    createChat,
    deleteChat,
    renameChat,
  } = useSessionChats(sessionId, { initialData: initialChatsData });

  const getChatHref = useCallback(
    (chatId: string) => `/sessions/${sessionId}/chats/${chatId}`,
    [sessionId],
  );

  const switchChat = useCallback(
    (chatId: string) => {
      if (chatId === (optimisticActiveChatId ?? routeChatId)) {
        return;
      }

      const href = getChatHref(chatId);
      prefetchedChatHrefsRef.current.add(href);
      setOptimisticActiveChatId(chatId);
      startChatNavigationTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [getChatHref, optimisticActiveChatId, routeChatId, router],
  );

  useEffect(() => {
    if (optimisticActiveChatId && optimisticActiveChatId === routeChatId) {
      setOptimisticActiveChatId(null);
    }
  }, [optimisticActiveChatId, routeChatId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const chat of chats.slice(0, 6)) {
        const href = getChatHref(chat.id);
        if (prefetchedChatHrefsRef.current.has(href)) {
          continue;
        }

        prefetchedChatHrefsRef.current.add(href);
        router.prefetch(href);
      }
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [chats, getChatHref, router]);

  const activeChatId = optimisticActiveChatId ?? routeChatId;

  const layoutContext = useMemo(
    () => ({
      session: {
        title: initialSession.title,
      },
      chats,
      chatsLoading,
      createChat,
      switchChat,
      deleteChat,
      renameChat,
    }),
    [
      initialSession,
      chats,
      chatsLoading,
      createChat,
      switchChat,
      deleteChat,
      renameChat,
    ],
  );

  return (
    <SessionLayoutContext.Provider value={layoutContext}>
      <WorkspacePanelProvider>
        <SessionLayoutInner activeChatId={activeChatId}>
          {children}
        </SessionLayoutInner>
      </WorkspacePanelProvider>
    </SessionLayoutContext.Provider>
  );
}
