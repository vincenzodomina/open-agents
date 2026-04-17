import { cache } from "react";
import { resolveAppSession } from "./resolve-app-session";

export const getServerSession = cache(async () => resolveAppSession());
