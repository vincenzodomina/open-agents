import { checkBotId } from "botid/server";
import { botIdConfig } from "./botid";

type BotVerification = Awaited<ReturnType<typeof checkBotId>>;

const BYPASSED_BOT_VERIFICATION: BotVerification = {
  isHuman: true,
  isBot: false,
  isVerifiedBot: false,
  bypassed: true,
};

export function isBotIdEnforced(): boolean {
  return process.env.VERCEL === "1";
}

export async function verifyBotIdRequest(): Promise<BotVerification> {
  if (!isBotIdEnforced()) {
    return BYPASSED_BOT_VERIFICATION;
  }

  return checkBotId(botIdConfig);
}
