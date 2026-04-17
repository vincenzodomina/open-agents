import type { SandboxState } from "@open-harness/sandbox";
import type { ModelVariant } from "@/lib/model-variants";
import type { GlobalSkillRef } from "@/lib/skills/global-skill-refs";

export interface User {
  id: string;
  provider: "github" | "vercel" | "supabase";
  externalId: string;
  accessToken: string;
  refreshToken: string | null;
  scope: string | null;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  tokenExpiresAt: Date | null;
  updatedAt: Date;
  lastLoginAt: Date;
}

export type NewUser = Omit<
  User,
  "createdAt" | "updatedAt" | "lastLoginAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
};

export interface Account {
  id: string;
  userId: string;
  provider: "github";
  externalUserId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scope: string | null;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewAccount = Omit<Account, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface GitHubInstallation {
  id: string;
  userId: string;
  installationId: number;
  accountLogin: string;
  accountType: "User" | "Organization";
  repositorySelection: "all" | "selected";
  installationUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewGitHubInstallation = Omit<
  GitHubInstallation,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface Session {
  id: string;
  userId: string;
  title: string;
  status: "running" | "completed" | "failed" | "archived";
  repoOwner: string | null;
  repoName: string | null;
  branch: string | null;
  cloneUrl: string | null;
  isNewBranch: boolean;
  autoCommitPushOverride: boolean | null;
  autoCreatePrOverride: boolean | null;
  globalSkillRefs: GlobalSkillRef[];
  sandboxState: SandboxState | null | undefined;
  lifecycleState:
    | "provisioning"
    | "active"
    | "hibernating"
    | "hibernated"
    | "restoring"
    | "archived"
    | "failed"
    | null
    | undefined;
  lifecycleVersion: number;
  lastActivityAt: Date | null;
  sandboxExpiresAt: Date | null;
  hibernateAfter: Date | null;
  lifecycleRunId: string | null;
  lifecycleError: string | null;
  linesAdded: number | null;
  linesRemoved: number | null;
  prNumber: number | null;
  prStatus: "open" | "merged" | "closed" | null;
  snapshotUrl: string | null;
  snapshotCreatedAt: Date | null;
  snapshotSizeBytes: number | null;
  cachedDiff: unknown;
  cachedDiffUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Insert shape: required keys plus any subset of optional session columns (DB defaults fill the rest). */
export type NewSession = Partial<Session> &
  Pick<Session, "userId" | "title"> & {
    id?: string;
  };

export interface Chat {
  id: string;
  sessionId: string;
  title: string;
  modelId: string | null;
  activeStreamId: string | null;
  lastAssistantMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewChat = Omit<Chat, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface Share {
  id: string;
  chatId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewShare = Omit<Share, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  parts: unknown;
  createdAt: Date;
}

export type NewChatMessage = Omit<ChatMessage, "createdAt"> & {
  createdAt?: Date;
};

export interface ChatRead {
  userId: string;
  chatId: string;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NewChatRead = ChatRead;

export interface WorkflowRun {
  id: string;
  chatId: string;
  sessionId: string;
  userId: string;
  modelId: string | null;
  status: "completed" | "aborted" | "failed";
  startedAt: Date;
  finishedAt: Date;
  totalDurationMs: number;
  createdAt: Date;
}

export type NewWorkflowRun = Omit<WorkflowRun, "createdAt"> & {
  createdAt?: Date;
};

export interface WorkflowRunStep {
  id: string;
  workflowRunId: string;
  stepNumber: number;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  finishReason: string | null;
  rawFinishReason: string | null;
  createdAt: Date;
}

export type NewWorkflowRunStep = Omit<WorkflowRunStep, "createdAt"> & {
  createdAt?: Date;
};

export interface LinkedAccount {
  id: string;
  userId: string;
  provider: "slack" | "discord" | "whatsapp" | "telegram";
  externalId: string;
  workspaceId: string | null;
  metadata: Record<string, unknown> | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export type NewLinkedAccount = Omit<
  LinkedAccount,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface UserPreferences {
  id: string;
  userId: string;
  defaultModelId: string | null;
  defaultSubagentModelId: string | null;
  defaultSandboxType: "vercel";
  defaultDiffMode: "unified" | "split";
  autoCommitPush: boolean;
  autoCreatePr: boolean;
  alertsEnabled: boolean;
  alertSoundEnabled: boolean;
  publicUsageEnabled: boolean;
  globalSkillRefs: GlobalSkillRef[];
  modelVariants: ModelVariant[];
  enabledModelIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type NewUserPreferences = Omit<
  UserPreferences,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface UsageEvent {
  id: string;
  userId: string;
  source: "web";
  agentType: "main" | "subagent";
  provider: string | null;
  modelId: string | null;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  toolCallCount: number;
  createdAt: Date;
}

export type NewUsageEvent = Omit<UsageEvent, "id" | "createdAt"> & {
  id?: string;
  createdAt?: Date;
};
