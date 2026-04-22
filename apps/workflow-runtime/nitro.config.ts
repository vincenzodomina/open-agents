import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  srcDir: "./server",
  modules: ["workflow/nitro"],
  rollupConfig: {
    // The workflow SDK's generated steps.mjs relies on module-load
    // side effects (registerStepFunction calls). Rollup tree-shakes
    // these by default because neither `workflow` nor `@workflow/core`
    // declare sideEffects. Force them to be treated as side-effectful.
    treeshake: {
      moduleSideEffects: (id: string, external: boolean): boolean => {
        if (id.includes(".nitro/workflow/")) return true;
        if (id.includes("node_modules/workflow/")) return true;
        if (id.includes("node_modules/@workflow/")) return true;
        return !external;
      },
    },
  },
});
