import type {
  BufferEncoding as JbBufferEncoding,
  FsStat,
  IFileSystem,
} from "just-bash";
import type { FsClient } from "isomorphic-git";

/**
 * Bridges {@link IFileSystem} (just-bash) to isomorphic-git’s {@link FsClient} ({@code fs.promises} shape).
 */
export function createFsClientFromIFileSystem(fs: IFileSystem): FsClient {
  const promises = {
    async readFile(
      filepath: string,
      options?: BufferEncoding | { encoding?: BufferEncoding | null } | null,
    ): Promise<string | Buffer> {
      const encoding =
        typeof options === "string"
          ? options
          : (options?.encoding ?? undefined);
      if (encoding === "utf8" || encoding === "utf-8") {
        return fs.readFile(filepath, "utf-8");
      }
      const buf = await fs.readFileBuffer(filepath);
      return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
    },

    async writeFile(
      filepath: string,
      data: string | Uint8Array | Buffer,
      options?: BufferEncoding | { encoding?: BufferEncoding },
    ): Promise<void> {
      const encoding =
        typeof options === "string"
          ? options
          : options && typeof options === "object" && "encoding" in options
            ? options.encoding
            : undefined;
      if (typeof data === "string") {
        await fs.writeFile(filepath, data, {
          encoding: (encoding ?? "utf8") as JbBufferEncoding,
        });
        return;
      }
      const u8 =
        data instanceof Buffer
          ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
          : data;
      await fs.writeFile(filepath, u8);
    },

    async unlink(filepath: string): Promise<void> {
      await fs.rm(filepath, { force: true });
    },

    async readdir(filepath: string): Promise<string[]> {
      return fs.readdir(filepath);
    },

    async mkdir(
      filepath: string,
      options?: { recursive?: boolean; mode?: number },
    ): Promise<void> {
      await fs.mkdir(filepath, { recursive: options?.recursive ?? false });
    },

    async rmdir(filepath: string): Promise<void> {
      await fs.rm(filepath, { recursive: true, force: true });
    },

    async stat(filepath: string): Promise<ReturnType<typeof mapStat>> {
      return mapStat(await fs.stat(filepath));
    },

    async lstat(filepath: string): Promise<ReturnType<typeof mapStat>> {
      return mapStat(await fs.lstat(filepath));
    },

    async readlink(filepath: string): Promise<string> {
      return fs.readlink(filepath);
    },

    async symlink(target: string, filepath: string): Promise<void> {
      await fs.symlink(target, filepath);
    },

    async chmod(filepath: string, mode: number): Promise<void> {
      await fs.chmod(filepath, mode);
    },
  };

  return { promises };
}

function mapStat(s: FsStat) {
  const mtimeMs = s.mtime.getTime();
  return {
    isFile: () => s.isFile,
    isDirectory: () => s.isDirectory,
    isSymbolicLink: () => s.isSymbolicLink,
    size: s.size,
    mode: s.mode,
    mtime: s.mtime,
    get mtimeMs() {
      return mtimeMs;
    },
  };
}
