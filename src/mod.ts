import { expandGlob } from "std/fs/mod.ts";
import { basename } from "std/path/basename.ts";
import * as YAML from "std/yaml/mod.ts";
import { Config, ExecutableConfig, RenameConfig } from "./config.ts";
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

export async function findExecutables(
  _user: string,
  repo: string,
  packageDir: string,
  executables: ReadonlyArray<ExecutableConfig> | undefined,
): Promise<ReadonlyArray<Executable>> {
  const result: Executable[] = [];

  const defaultExecutables: ReadonlyArray<ExecutableConfig> = [
    { glob: `**/${repo}`, as: repo },
  ];

  for (const { glob, as } of executables ?? defaultExecutables) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
    });
    for await (const { path } of entries) {
      result.push({
        path,
        as: as ?? basename(path),
      });
    }
  }

  return result;
}

export type Executable = {
  path: string;
  as: string;
};

export async function linkExecutable(
  executables: ReadonlyArray<Executable>,
  binDir: string,
) {
  await Deno.mkdir(binDir, { recursive: true });

  await Promise.all(executables.map(async ({ path, as }) => {
    const destination = `${binDir}/${as}`;
    await Deno.chmod(path, 0o755);
    await Deno.remove(destination).catch(() => {});
    await Deno.symlink(path, destination);
  }));
}
