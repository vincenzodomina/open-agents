import { resolve } from "node:path";
import { StandaloneBuilder } from "@workflow/builders";

const workingDir = resolve(import.meta.dir);

const builder = new StandaloneBuilder({
  buildTarget: "standalone",
  dirs: ["./workflows"],
  workingDir,
  stepsBundlePath: "./.well-known/workflow/v1/step.mjs",
  workflowsBundlePath: "./.well-known/workflow/v1/flow.mjs",
  webhookBundlePath: "./.well-known/workflow/v1/webhook.mjs",
});

console.log("[runtime] building workflow bundles");
await builder.build();
console.log("[runtime] workflow bundles ready");
