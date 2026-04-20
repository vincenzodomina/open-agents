import path from "node:path/posix";

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import type { AuthCallback, StatusRow } from "isomorphic-git";

import type { IFileSystem } from "just-bash";

import { createFsClientFromIFileSystem } from "./isomorphic-git-fs";
import { scrubHttpsCredentials } from "./git-url";

async function raceAbort<T>(
  signal: AbortSignal | undefined,
  promise: Promise<T>,
): Promise<T> {
  if (!signal) {
    return promise;
  }
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
  return await Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    }),
  ]);
}

async function preferredRemote(
  fs: ReturnType<typeof createFsClientFromIFileSystem>,
  dir: string,
): Promise<string> {
  const list = await git.listRemotes({ fs, dir });
  const origin = list.find((r) => r.remote === "origin");
  return origin?.remote ?? list[0]?.remote ?? "origin";
}

export function commandInvokesGit(command: string): boolean {
  return /\bgit(\s|$)/.test(command);
}

/** Splits on `&&` outside of quotes (single segment if no `&&`). */
export function splitShellChain(input: string): string[] {
  const segments: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (quote) {
      current += c;
      if (c === quote) {
        quote = null;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      current += c;
      continue;
    }
    if (c === "&" && input[i + 1] === "&") {
      segments.push(current.trim());
      current = "";
      i++;
      continue;
    }
    current += c;
  }
  segments.push(current.trim());
  return segments.filter((s) => s.length > 0);
}

export function stripEnvPrefix(command: string): string {
  let s = command.trimStart();
  const envLine = /^([A-Za-z_][A-Za-z0-9_]*=(?:[^\s]+|"[^"]*"|'[^']*')\s+)*/;
  return s.replace(envLine, "").trimStart();
}

export function tokenizeArgs(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    while (i < line.length && line[i] === " ") {
      i++;
    }
    if (i >= line.length) {
      break;
    }
    const c = line[i]!;
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      let start = i;
      while (i < line.length && line[i] !== quote) {
        i++;
      }
      out.push(line.slice(start, i));
      if (line[i] === quote) {
        i++;
      }
      continue;
    }
    let start = i;
    while (i < line.length && line[i] !== " ") {
      i++;
    }
    out.push(line.slice(start, i));
  }
  return out;
}

function parseGitArgv(command: string): string[] | null {
  const s = stripEnvPrefix(command);
  if (!s.startsWith("git")) {
    return null;
  }
  const rest = s.slice(3).trimStart();
  if (rest.length === 0) {
    return [];
  }
  return tokenizeArgs(rest);
}

export function parseCdSegment(segment: string): string | null {
  const m = segment.match(/^cd\s+(.+)$/);
  if (!m?.[1]) {
    return null;
  }
  return stripOuterQuotes(m[1].trim());
}

function stripOuterQuotes(s: string): string {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

export function resolveVirtualPath(cwd: string, target: string): string {
  const t = stripOuterQuotes(target.trim());
  if (t.startsWith("/")) {
    return path.normalize(t);
  }
  return path.normalize(path.join(cwd, t));
}

function makeOnAuth(token: string | undefined): AuthCallback | undefined {
  if (token === undefined || token === "") {
    return undefined;
  }
  return () => ({
    username: "git",
    password: token,
  });
}

const SKIP_ROW = new Set(["0,0,0", "1,1,1"]);

function statusShortPrefix(row: StatusRow): string | undefined {
  const [, head, workdir, stage] = row;
  const key = `${head},${workdir},${stage}`;
  if (SKIP_ROW.has(key)) {
    return undefined;
  }
  const prefixes: Record<string, string> = {
    "0,0,3": "AD",
    "0,2,0": "??",
    "0,2,2": "A ",
    "0,2,3": "AM",
    "1,0,0": "D ",
    "1,0,1": " D",
    "1,0,3": "MD",
    "1,1,0": "DU",
    "1,1,3": "MM",
    "1,2,0": "DU",
    "1,2,1": " M",
    "1,2,2": "M ",
    "1,2,3": "MM",
  };
  return prefixes[key] ?? "!!";
}

function rowHasPendingChange(row: StatusRow): boolean {
  return statusShortPrefix(row) !== undefined;
}

/** Minimal pathspec match for `git ls-files` (files under a directory prefix). */
function fileMatchesLsPathspec(file: string, spec: string): boolean {
  if (spec.endsWith("/")) {
    const dir = spec.slice(0, -1);
    return file === dir || file.startsWith(`${dir}/`);
  }
  return file === spec || file.startsWith(`${spec}/`);
}

function fileMatchesLsPathspecs(file: string, specs: string[]): boolean {
  if (specs.length === 0) {
    return true;
  }
  return specs.some((spec) => fileMatchesLsPathspec(file, spec));
}

async function dispatchGit(
  argv: string[],
  ctx: {
    fs: ReturnType<typeof createFsClientFromIFileSystem>;
    dir: string;
    onAuth?: AuthCallback;
  },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const { fs, dir, onAuth } = ctx;
  const sub = argv[0];

  if (sub === undefined) {
    return {
      stdout: "",
      stderr: "usage: git <command> [<args>]",
      exitCode: 1,
    };
  }

  switch (sub) {
    case "version": {
      return {
        stdout: `git version ${git.version()} (isomorphic-git)\n`,
        stderr: "",
        exitCode: 0,
      };
    }
    case "rev-parse": {
      if (argv.includes("--show-toplevel")) {
        return { stdout: `${dir}\n`, stderr: "", exitCode: 0 };
      }
      return {
        stdout: "",
        stderr: "git rev-parse: only --show-toplevel is supported in just-bash",
        exitCode: 1,
      };
    }
    case "status": {
      const branch = (await git.currentBranch({ fs, dir })) ?? "HEAD";
      const matrix = await git.statusMatrix({ fs, dir });
      let out = `On branch ${branch}\n`;
      const lines: string[] = [];
      for (const row of matrix) {
        const prefix = statusShortPrefix(row);
        if (prefix === undefined) {
          continue;
        }
        lines.push(`${prefix} ${row[0]}`);
      }
      if (lines.length > 0) {
        out += "\n";
        out += lines.join("\n");
        out += "\n";
      }
      return { stdout: out, stderr: "", exitCode: 0 };
    }
    case "log": {
      let depth: number | undefined;
      const oneline = argv.includes("--oneline");
      const nIdx = argv.indexOf("-n");
      if (nIdx !== -1 && argv[nIdx + 1] !== undefined) {
        depth = Number.parseInt(argv[nIdx + 1]!, 10);
      }
      const commits = await git.log({
        fs,
        dir,
        ...(depth !== undefined && !Number.isNaN(depth) ? { depth } : {}),
      });
      let out = "";
      for (const c of commits) {
        const summary = c.commit.message.split("\n")[0] ?? "";
        if (oneline) {
          out += `${c.oid.slice(0, 7)} ${summary}\n`;
        } else {
          out += `commit ${c.oid}\n`;
          out += `${summary}\n\n`;
        }
      }
      return { stdout: out, stderr: "", exitCode: 0 };
    }
    case "branch": {
      if (argv.length === 1) {
        const branches = await git.listBranches({ fs, dir });
        const cur = await git.currentBranch({ fs, dir });
        let out = "";
        for (const b of branches) {
          const mark = b === cur ? "* " : "  ";
          out += `${mark}${b}\n`;
        }
        return { stdout: out, stderr: "", exitCode: 0 };
      }
      const dashed = argv.slice(1).filter((a) => a.startsWith("-"));
      if (dashed.length > 0) {
        return {
          stdout: "",
          stderr:
            "git branch: only `git branch` (list) or `git branch <name>` (create) are supported",
          exitCode: 1,
        };
      }
      const positional = argv.slice(1);
      if (positional.length > 1) {
        return {
          stdout: "",
          stderr:
            "git branch: only a single new branch name is supported (no start-point)",
          exitCode: 1,
        };
      }
      const name = positional[0];
      if (name === undefined) {
        return {
          stdout: "",
          stderr: "git branch: expected branch name",
          exitCode: 1,
        };
      }
      await git.branch({ fs, dir, ref: name, checkout: false });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "checkout": {
      const flags = new Set(argv.filter((a) => a.startsWith("-")));
      const target = argv.slice(1).find((a) => !a.startsWith("-"));
      if (target === undefined) {
        return {
          stdout: "",
          stderr: "git checkout: branch or path required",
          exitCode: 1,
        };
      }
      await git.checkout({
        fs,
        dir,
        ref: target,
        ...(flags.has("-f") || flags.has("--force") ? { force: true } : {}),
      });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "remote": {
      if (argv[1] === "-v" || argv[1] === "-vv") {
        const remotes = await git.listRemotes({ fs, dir });
        let out = "";
        for (const r of remotes) {
          const safeUrl = scrubHttpsCredentials(r.url) ?? r.url;
          out += `${r.remote}\t${safeUrl} (fetch)\n`;
          out += `${r.remote}\t${safeUrl} (push)\n`;
        }
        return { stdout: out, stderr: "", exitCode: 0 };
      }
      return {
        stdout: "",
        stderr: "git remote: only -v is supported in just-bash",
        exitCode: 1,
      };
    }
    case "add": {
      const paths = argv.slice(1).filter((a) => !a.startsWith("-"));
      const dot =
        paths.length === 0 ||
        paths.includes(".") ||
        argv.includes("--all") ||
        argv.includes("-A");
      if (dot) {
        const matrix = await git.statusMatrix({ fs, dir });
        const toStage = matrix
          .filter((row) => rowHasPendingChange(row))
          .map((row) => row[0]);
        if (toStage.length > 0) {
          await git.add({ fs, dir, filepath: toStage, parallel: true });
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }
      await git.add({ fs, dir, filepath: paths, parallel: true });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "rm": {
      const paths = argv.slice(1).filter((a) => !a.startsWith("-"));
      for (const p of paths) {
        await git.remove({ fs, dir, filepath: p });
      }
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "ls-files": {
      const rest = argv.slice(1);
      const dd = rest.indexOf("--");
      const beforeDd = dd >= 0 ? rest.slice(0, dd) : rest;
      const afterDd = dd >= 0 ? rest.slice(dd + 1) : [];

      const flags = new Set(beforeDd.filter((a) => a.startsWith("-")));
      const others = flags.has("--others") || flags.has("-o");
      const excludeStandard = flags.has("--exclude-standard");
      const errorUnmatch = flags.has("--error-unmatch");

      const pathspecsBefore = beforeDd.filter((a) => !a.startsWith("-"));
      const pathspecs = [...pathspecsBefore, ...afterDd];

      if (errorUnmatch) {
        if (pathspecs.length !== 1) {
          return {
            stdout: "",
            stderr:
              "git ls-files --error-unmatch requires exactly one pathspec\n",
            exitCode: 1,
          };
        }
        const spec = pathspecs[0]!;
        const tracked = await git.listFiles({ fs, dir });
        const matched = tracked.some((f) => fileMatchesLsPathspec(f, spec));
        if (!matched) {
          return {
            stdout: "",
            stderr: `error: pathspec '${spec}' did not match any file(s) known to git.\n`,
            exitCode: 1,
          };
        }
        return { stdout: "", stderr: "", exitCode: 0 };
      }

      if (others) {
        const matrix = await git.statusMatrix({
          fs,
          dir,
          ignored: !excludeStandard,
        });
        const paths = matrix
          .filter((row) => {
            const p = statusShortPrefix(row);
            if (excludeStandard) {
              return p === "??";
            }
            return p === "??" || p === "!!";
          })
          .map((row) => row[0])
          .filter((fp) => fileMatchesLsPathspecs(fp, pathspecs));

        const unique = [...new Set(paths)].sort((a, b) => a.localeCompare(b));
        return {
          stdout: unique.length > 0 ? `${unique.join("\n")}\n` : "",
          stderr: "",
          exitCode: 0,
        };
      }

      let files = await git.listFiles({ fs, dir });
      files = files.filter((f) => fileMatchesLsPathspecs(f, pathspecs));
      files.sort((a, b) => a.localeCompare(b));
      return {
        stdout: files.length > 0 ? `${files.join("\n")}\n` : "",
        stderr: "",
        exitCode: 0,
      };
    }
    case "commit": {
      const mIdx = argv.indexOf("-m");
      const message =
        mIdx !== -1 && argv[mIdx + 1] !== undefined
          ? argv[mIdx + 1]!
          : "(no message)";
      const sha = await git.commit({
        fs,
        dir,
        message,
        author: {
          name: String(
            (await git.getConfig({ fs, dir, path: "user.name" })) ??
              "open-harness",
          ),
          email: String(
            (await git.getConfig({ fs, dir, path: "user.email" })) ??
              "open-harness@users.noreply.local",
          ),
        },
      });
      return {
        stdout: `[${sha.slice(0, 7)}] ${message}\n`,
        stderr: "",
        exitCode: 0,
      };
    }
    case "diff": {
      const rest = argv.slice(1);
      const wantsPatch = rest.some(
        (a) =>
          a === "-p" ||
          a === "-u" ||
          a === "--patch" ||
          a.startsWith("--unified"),
      );
      const explicitNameOnly =
        rest.includes("--name-only") || rest.includes("--name-status");
      if (wantsPatch && !explicitNameOnly) {
        return {
          stdout: "",
          stderr:
            "git diff: unified patch output is not supported in just-bash; use --name-only\n",
          exitCode: 1,
        };
      }
      const matrix = await git.statusMatrix({ fs, dir });
      const names = matrix
        .filter((row) => rowHasPendingChange(row))
        .map((row) => row[0]);
      let stderr = "";
      if (!explicitNameOnly && rest.length === 0) {
        stderr =
          "note: listing changed paths only (not a unified diff); use --name-only to silence\n";
      }
      return {
        stdout: names.length > 0 ? `${names.join("\n")}\n` : "",
        stderr,
        exitCode: 0,
      };
    }
    case "config": {
      const key = argv[1];
      if (argv.length >= 2 && key !== undefined && !key.startsWith("-")) {
        const val = await git.getConfig({ fs, dir, path: key });
        if (val === undefined) {
          return { stdout: "", stderr: "", exitCode: 1 };
        }
        return { stdout: `${val}\n`, stderr: "", exitCode: 0 };
      }
      return {
        stdout: "",
        stderr: "git config: only single-key reads are supported",
        exitCode: 1,
      };
    }
    case "fetch": {
      const remoteName = await preferredRemote(fs, dir);
      await git.fetch({
        fs,
        http,
        dir,
        remote: remoteName,
        ...(onAuth !== undefined ? { onAuth } : {}),
      });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "pull": {
      const remotePull = await preferredRemote(fs, dir);
      await git.pull({
        fs,
        http,
        dir,
        remote: remotePull,
        ...(onAuth !== undefined ? { onAuth } : {}),
        author: {
          name: String(
            (await git.getConfig({ fs, dir, path: "user.name" })) ??
              "open-harness",
          ),
          email: String(
            (await git.getConfig({ fs, dir, path: "user.email" })) ??
              "open-harness@users.noreply.local",
          ),
        },
      });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "push": {
      const remotePush = await preferredRemote(fs, dir);
      await git.push({
        fs,
        http,
        dir,
        remote: remotePush,
        ...(onAuth !== undefined ? { onAuth } : {}),
      });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    default:
      return {
        stdout: "",
        stderr: `git ${sub}: command not implemented in just-bash (isomorphic-git shim)`,
        exitCode: 1,
      };
  }
}

export async function execJustBashGitLine(
  command: string,
  vfs: IFileSystem,
  virtualCwd: string,
  options: { githubToken?: string; signal?: AbortSignal },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const argv = parseGitArgv(command);
  if (argv === null) {
    return {
      stdout: "",
      stderr:
        "just-bash git shim: command must start with `git` after optional env assignments",
      exitCode: 1,
    };
  }

  try {
    return await raceAbort(
      options.signal,
      (async (): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
      }> => {
        const fs = createFsClientFromIFileSystem(vfs);
        let dir: string;
        try {
          dir = await git.findRoot({ fs, filepath: virtualCwd });
        } catch {
          return {
            stdout: "",
            stderr:
              "fatal: not a git repository (or any parent up from virtual cwd)",
            exitCode: 128,
          };
        }
        const onAuth = makeOnAuth(options.githubToken);
        return dispatchGit(argv, { fs, dir, onAuth });
      })(),
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { stdout: "", stderr: "Aborted\n", exitCode: 130 };
    }
    const msg = error instanceof Error ? error.message : String(error);
    return { stdout: "", stderr: `${msg}\n`, exitCode: 1 };
  }
}
