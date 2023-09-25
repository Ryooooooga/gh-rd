import { expandGlob } from "std/fs/mod.ts";
import { basename } from "std/path/basename.ts";
import * as YAML from "std/yaml/mod.ts";
import {
  CompletionConfig,
  Config,
  ExecutableConfig,
  RenameConfig,
} from "./config.ts";
import { getConfigPath, getStatePath } from "./path.ts";
import { State } from "./state.ts";
import { dirname } from "std/path/dirname.ts";

export async function loadConfig(): Promise<Config> {
  const { default: config } = await import(getConfigPath());
  return config;
}

export async function loadState(): Promise<State> {
  try {
    const content = await Deno.readTextFile(getStatePath());
    return YAML.parse(content) as State;
  } catch (_err) {
    return { tools: [] };
  }
}

export async function saveState(state: State) {
  const statePath = getStatePath();
  const content = YAML.stringify(state);
  await Deno.mkdir(dirname(statePath), { recursive: true });
  await Deno.writeTextFile(statePath, content);
}

export async function renameFiles(
  _user: string,
  _repo: string,
  packageDir: string,
  renames: ReadonlyArray<RenameConfig>,
) {
  for (const { from, to } of renames) {
    const entries = expandGlob(from, {
      root: packageDir,
      includeDirs: true,
    });

    for await (const { path: fromPath } of entries) {
      const toPath = `${packageDir}/${to}`;
      await Deno.rename(fromPath, toPath);
    }
  }
}

export type Executables = Record<string, string>;

export async function findExecutables(
  _user: string,
  repo: string,
  packageDir: string,
  executables: ReadonlyArray<ExecutableConfig> | undefined,
): Promise<Readonly<Executables>> {
  const result: Executables = {};

  const defaultExecutables: ReadonlyArray<ExecutableConfig> = [
    { glob: `**/${repo}`, as: repo },
  ];

  for (const { glob, exclude, as } of executables ?? defaultExecutables) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const { path } of entries) {
      result[as ?? basename(path)] = path;
    }
  }

  return result;
}

export async function linkExecutable(
  executables: Readonly<Executables>,
  binDir: string,
) {
  await Deno.mkdir(binDir, { recursive: true });

  await Promise.all(
    Object.entries(executables).map(async ([as, path]) => {
      const destination = `${binDir}/${as}`;
      await Deno.chmod(path, 0o755);
      await Deno.remove(destination).catch(() => {});
      await Deno.symlink(path, destination);
    }),
  );
}

export type Completions = Record<string, string>;

export async function findCompletions(
  _user: string,
  _repo: string,
  packageDir: string,
  completions: ReadonlyArray<CompletionConfig> | undefined,
): Promise<Readonly<Completions>> {
  const result: Completions = {};

  const defaultCompletions: ReadonlyArray<CompletionConfig> = [
    { glob: `**/_*`, exclude: ["**/_*.*"] },
  ];

  for (const { glob, exclude, as } of completions ?? defaultCompletions) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const { path } of entries) {
      result[as ?? basename(path)] = path;
    }
  }

  return result;
}

export async function linkCompletion(
  completions: Readonly<Completions>,
  completionsDir: string,
) {
  await Deno.mkdir(completionsDir, { recursive: true });

  await Promise.all(
    Object.entries(completions).map(async ([as, path]) => {
      const destination = `${completionsDir}/${as}`;
      await Deno.remove(destination).catch(() => {});
      await Deno.symlink(path, destination);
    }),
  );
}
