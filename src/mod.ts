import { expandGlob } from "std/fs/mod.ts";
import { basename } from "std/path/basename.ts";
import { Config, ExecutableConfig } from "./config.ts";
import { getConfigPath } from "./path.ts";

export async function loadConfig(): Promise<Config> {
  const { default: config } = await import(getConfigPath());
  return config;
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
