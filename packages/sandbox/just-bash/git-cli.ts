import path from "node:path/posix";

import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import type { AuthCallback, StatusRow } from "isomorphic-git";

import type { IFileSystem } from "just-bash";

import { createFsClientFromIFileSystem } from "./isomorphic-git-fs";

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
    username: token,
    password: "",
  });
}

/** Maps statusMatrix tuple to two-letter short status (see isomorphic-git docs). */
function shortFromRow(row: StatusRow): string | null {
  const [, head, workdir, stage] = row;
  const key = `${head},${workdir},${stage}`;
  const prefixes: Record<string, string | null> = {
    "0,0,0": null,
    "1,1,1": null,
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
  return prefixes[key] ?? null;
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
        const prefix = shortFromRow(row);
        if (prefix === null) {
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
      const name = argv[argv.length - 1];
      if (name === undefined || name.startsWith("-")) {
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
          out += `${r.remote}\t${r.url} (fetch)\n`;
          out += `${r.remote}\t${r.url} (push)\n`;
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
          .filter((row) => shortFromRow(row) !== null)
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
      const matrix = await git.statusMatrix({ fs, dir });
      const names = matrix
        .filter((row) => shortFromRow(row) !== null)
        .map((row) => row[0]);
      return {
        stdout: names.length > 0 ? `${names.join("\n")}\n` : "",
        stderr: "",
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
      await git.fetch({
        fs,
        http,
        dir,
        remote: "origin",
        ...(onAuth !== undefined ? { onAuth } : {}),
      });
      return { stdout: "", stderr: "", exitCode: 0 };
    }
    case "pull": {
      await git.pull({
        fs,
        http,
        dir,
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
      await git.push({
        fs,
        http,
        dir,
        remote: "origin",
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
  options: { githubToken?: string },
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

  const fs = createFsClientFromIFileSystem(vfs);
  let dir: string;
  try {
    dir = await git.findRoot({ fs, filepath: virtualCwd });
  } catch {
    return {
      stdout: "",
      stderr: "fatal: not a git repository (or any parent up from virtual cwd)",
      exitCode: 128,
    };
  }

  const onAuth = makeOnAuth(options.githubToken);

  try {
    return await dispatchGit(argv, { fs, dir, onAuth });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { stdout: "", stderr: `${msg}\n`, exitCode: 1 };
  }
}
