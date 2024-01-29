import { expandGlob } from "../deps/std/fs.ts";
import { basename, dirname, extname } from "../deps/std/path.ts";
import {
  downloadReleasedAsset,
  extractArchive,
  findAssetURL,
} from "../assets/mod.ts";
import {
  CompletionConfig,
  Config,
  ExecutableConfig,
  RenameConfig,
  Shell,
  ToolConfig,
} from "../config/mod.ts";
import {
  fetchLatestReleaseTag,
  fetchReleasedArtifactURLs,
} from "../github/mod.ts";
import { build$, CommandBuilder } from "../deps/dax.ts";
import { getPackageDir } from "../path.ts";
import { State, ToolState } from "../state/mod.ts";
import { InstallationState, View } from "../view/mod.ts";

type InstallationStateUpdateHandler = (state: InstallationState) => void;

async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (_err) {
    return false;
  }
}

async function isExecutable(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile && stat.mode !== null && (stat.mode & 0o111) !== 0;
  } catch (_err) {
    return false;
  }
}

const parseRepositoryIdentity = (
  identity: `${string}/${string}`,
): [string, string] => {
  const segments = identity.split("/");
  if (segments.length !== 2) {
    throw new Error(`Invalid tool name: ${identity}`);
  }

  const [user, name] = segments;
  return [user, name];
};

async function getTag(
  user: string,
  repo: string,
  tag: string | undefined,
  onUpdate: InstallationStateUpdateHandler,
): Promise<string> {
  if (tag !== undefined) {
    return tag;
  }

  onUpdate({ type: "fetching_release_tag" });
  return await fetchLatestReleaseTag(user, repo);
}

async function downloadAsset(
  tempDir: string,
  user: string,
  repo: string,
  tag: string,
  use: string | undefined,
  onUpdate: InstallationStateUpdateHandler,
): Promise<string> {
  onUpdate({ type: "fetching_artifact_urls", tag });
  const artifactURLs = await fetchReleasedArtifactURLs(user, repo, tag);

  const assetURL = findAssetURL(
    artifactURLs,
    use,
    Deno.build.os,
    Deno.build.arch,
  );
  if (assetURL === undefined) {
    throw new Error(`No asset found`);
  }

  const filePath = `${tempDir}/${basename(assetURL)}`;

  onUpdate({ type: "downloading_asset", assetURL });
  await downloadReleasedAsset(assetURL, filePath);

  return filePath;
}

async function extractAsset(
  assetPath: string,
  packageDir: string,
  onUpdate: InstallationStateUpdateHandler,
): Promise<void> {
  onUpdate({ type: "extracting_asset", assetPath });
  await Deno.remove(packageDir, { recursive: true }).catch(() => {});
  await extractArchive(assetPath, packageDir);
}

async function renameFiles(
  renames: ReadonlyArray<RenameConfig>,
  packageDir: string,
  onUpdate: InstallationStateUpdateHandler,
) {
  onUpdate({ type: "renaming_files" });

  for (const { from, to, chmod } of renames) {
    const entries = expandGlob(from, {
      root: packageDir,
      includeDirs: true,
    });

    for await (const { path: fromPath } of entries) {
      const toPath = `${packageDir}/${to}`;

      await Deno.mkdir(dirname(toPath), { recursive: true });
      await Deno.rename(fromPath, toPath);

      if (chmod !== undefined) {
        await Deno.chmod(toPath, chmod);
      }
    }
  }
}

function defaultExecutables(
  _user: string,
  repo: string,
): ReadonlyArray<ExecutableConfig> {
  const isWindows = Deno.build.os === "windows" ||
    (Deno.build.os === "linux" && Deno.env.has("WSLENV"));

  return [
    {
      glob: "**/*",
      async match({ name, path }) {
        if (
          (name === repo) ||
          (isWindows && name.endsWith(".exe"))
        ) {
          return true;
        }

        return extname(name) === "" && await isExecutable(path);
      },
    },
    {
      glob: "**/bin/*",
    },
  ];
}

async function linkExecutables(
  config: ToolConfig,
  user: string,
  repo: string,
  tag: string,
  packageDir: string,
  binDir: string,
  onUpdate: InstallationStateUpdateHandler,
): Promise<void> {
  onUpdate({ type: "linking_executables" });

  const bin: Record<string, string> = {};

  const executables = config.executables ??
    defaultExecutables(user, repo);

  for (const { glob, exclude, match, as } of executables) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const entry of entries) {
      if (match === undefined || await match(entry)) {
        bin[as ?? entry.name] = entry.path;
      }
    }
  }

  if (config.onDownload !== undefined) {
    const commandBuilder = new CommandBuilder()
      .cwd(packageDir);

    const $ = build$({
      commandBuilder,
    });

    await config.onDownload({
      name: config.name,
      tag,
      packageDir,
      bin,
      $,
    }).catch((err) => {
      console.error(err);
    });
  }

  await Deno.mkdir(binDir, { recursive: true });

  await Promise.all(
    Object.entries(bin).map(async ([as, path]) => {
      const destinationPath = `${binDir}/${as}`;
      await Deno.chmod(path, 0o755);
      await Deno.remove(destinationPath).catch(() => {});
      await Deno.symlink(path, destinationPath);
    }),
  );
}

function defaultCompletions(
  shell: Shell,
  _user: string,
  _repo: string,
): ReadonlyArray<CompletionConfig> {
  function shellExt(shell: Shell): string {
    switch (shell) {
      case "zsh":
        return ".zsh";
      case "bash":
        return ".bash";
      case "fish":
        return ".fish";
      case "powershell":
        return ".ps1";
      default:
        return "";
    }
  }

  return [
    {
      glob: `**/_*`,
      exclude: ["**/_*.*"],
    },
    {
      glob: `**/{autocomplete,complete,completion,completions}/*${
        shellExt(shell)
      }`,
      exclude: [],
    },
  ];
}

function defaultCompletionName(path: string): string {
  let name = basename(path);

  const dotIndex = name.indexOf(".");
  if (dotIndex > 0) {
    name = name.slice(0, dotIndex);
  }

  if (name.startsWith("_")) {
    return name;
  }

  return `_${name}`;
}

async function linkCompletions(
  config: ToolConfig,
  shell: Shell,
  user: string,
  repo: string,
  packageDir: string,
  completionsDir: string,
  onUpdate: InstallationStateUpdateHandler,
): Promise<void> {
  onUpdate({ type: "linking_completions" });

  const files: Record<string, string> = {};

  const completions = config.completions ??
    defaultCompletions(shell, user, repo);

  for (const { glob, exclude, as } of completions) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const { path } of entries) {
      const name = as ?? defaultCompletionName(path);
      if (!(name in files)) {
        files[name] = path;
      }
    }
  }

  await Deno.mkdir(completionsDir, { recursive: true });

  await Promise.all(
    Object.entries(files).map(async ([as, path]) => {
      const destination = `${completionsDir}/${as}`;
      await Deno.remove(destination).catch(() => {});
      await Deno.symlink(path, destination);
    }),
  );
}

function defaultManuals(
  _user: string,
  _repo: string,
): ReadonlyArray<CompletionConfig> {
  return [
    { glob: `**/*.[1-9]`, exclude: ["**/*.so.*"] },
  ];
}

async function linkManuals(
  config: ToolConfig,
  user: string,
  repo: string,
  packageDir: string,
  manualsDir: string,
  onUpdate: InstallationStateUpdateHandler,
): Promise<void> {
  onUpdate({ type: "linking_manuals" });

  const files: Record<string, string> = {};

  const manuals = config.manuals ??
    defaultManuals(user, repo);

  for (const { glob, exclude } of manuals) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const { path } of entries) {
      const name = basename(path);
      if (!(name in files)) {
        files[name] = path;
      }
    }
  }

  await Promise.all(
    Object.entries(files).map(async ([as, path]) => {
      const destination = `${manualsDir}/man${as[as.length - 1]}/${as}`;
      await Deno.mkdir(dirname(destination), { recursive: true });
      await Deno.remove(destination).catch(() => {});
      await Deno.symlink(path, destination);
    }),
  );
}

type InstallationResult =
  | { type: "installed"; tag: string }
  | { type: "up_to_date"; tag: string }
  | { type: "skipped" }
  | { type: "error"; error: unknown };

async function isUpToDate(
  tag: string,
  packageDir: string,
  state: ToolState | undefined,
): Promise<boolean> {
  return state !== undefined &&
    tag === state.tag &&
    await isDirectory(packageDir);
}

async function installPackage(
  tempDir: string,
  binDir: string,
  completionsDir: string,
  manualsDir: string,
  config: ToolConfig,
  shell: Shell,
  state: ToolState | undefined,
  onUpdate: InstallationStateUpdateHandler,
): Promise<InstallationResult> {
  try {
    if (config.enabled === false) {
      onUpdate({ type: "skipped" });
      return { type: "skipped" };
    }

    const [user, repo] = parseRepositoryIdentity(config.name);
    const packageDir = getPackageDir(user, repo);

    const tag = await getTag(user, repo, config.tag, onUpdate);
    if (await isUpToDate(tag, packageDir, state)) {
      onUpdate({ type: "up_to_date", tag });
      return { type: "up_to_date", tag };
    }

    const assetPath = await downloadAsset(
      tempDir,
      user,
      repo,
      tag,
      config.use,
      onUpdate,
    );

    await extractAsset(assetPath, packageDir, onUpdate);

    if (config.rename !== undefined) {
      await renameFiles(config.rename, packageDir, onUpdate);
    }

    await linkExecutables(
      config,
      user,
      repo,
      tag,
      packageDir,
      binDir,
      onUpdate,
    );

    await linkCompletions(
      config,
      shell,
      user,
      repo,
      packageDir,
      completionsDir,
      onUpdate,
    );

    await linkManuals(
      config,
      user,
      repo,
      packageDir,
      manualsDir,
      onUpdate,
    );

    onUpdate({ type: "completed", tag });
    return { type: "installed", tag };
  } catch (err) {
    onUpdate({ type: "error", error: err });
    return { type: "error", error: err };
  }
}

function loginShell(): Shell {
  function defaultShell(): Shell {
    switch (Deno.build.os) {
      case "windows":
        return "powershell";
      case "darwin":
        return "zsh";
      default:
        return "bash";
    }
  }

  const shellPath = Deno.env.get("SHELL");
  if (shellPath === undefined) {
    return defaultShell();
  }

  const shellName = basename(shellPath);
  switch (shellName) {
    case "zsh":
      return "zsh";
    case "bash":
      return "bash";
    case "fish":
      return "fish";
    case "pwsh":
      return "powershell";
    default:
      return defaultShell();
  }
}

export async function installAllPackages(
  tempDir: string,
  binDir: string,
  completionsDir: string,
  manualsDir: string,
  config: Config,
  currentState: State,
  view: View,
): Promise<{
  success: boolean;
  newState: State;
}> {
  try {
    view.start(config.tools);

    const stateMap = new Map(
      currentState.tools.map((state) => [state.name, state]),
    );

    const shell = config.shell ?? loginShell();

    const results = await Promise.all(
      config.tools.map(
        async (
          toolConfig,
        ): Promise<{
          success: boolean;
          newToolState: ToolState | undefined;
        }> => {
          const toolState = stateMap.get(toolConfig.name);

          const result = await installPackage(
            tempDir,
            binDir,
            completionsDir,
            manualsDir,
            toolConfig,
            shell,
            toolState,
            (state) => view.update(toolConfig.name, state),
          );

          switch (result.type) {
            case "installed":
              return {
                success: true,
                newToolState: { name: toolConfig.name, tag: result.tag },
              };
            case "up_to_date":
              return { success: true, newToolState: toolState };
            case "skipped":
              return { success: true, newToolState: toolState };
            case "error":
              return { success: false, newToolState: undefined };
            default:
              result satisfies never;
              throw new Error(`Unexpected result: ${JSON.stringify(result)}`);
          }
        },
      ),
    );

    const newState: State = {
      tools: results
        .map(({ newToolState }) => newToolState)
        .filter((state): state is ToolState => state !== undefined),
    };

    return {
      success: results.every(({ success }) => success),
      newState,
    };
  } finally {
    view.finish();
  }
}
