import { defineNitroPlugin } from "nitro/runtime";

// For Postgres World deployments: the Postgres World needs an explicit start()
// call on server init to subscribe to the graphile-worker queue. Local World
// is no-op on start(). Using optional chaining makes this safe for both.
export default defineNitroPlugin(async () => {
  const { getWorld } = await import("workflow/runtime");
  await getWorld().start?.();
});
