import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  srcDir: "./server",
  modules: ["workflow/nitro"],
});
