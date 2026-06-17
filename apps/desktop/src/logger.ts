import log from "electron-log";

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024;

log.initialize();
log.transports.file.maxSize = MAX_LOG_SIZE_BYTES;
log.transports.file.level = "info";
log.transports.console.level = "info";

export const logger = log;
export type Logger = typeof log;
