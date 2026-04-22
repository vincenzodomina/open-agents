import { defineEventHandler } from "nitro/h3";

export default defineEventHandler(() => ({
  status: "ok",
  service: "workflow-poc",
  ts: Date.now(),
}));
