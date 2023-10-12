import { expandGlob } from "std/fs/mod.ts";
import { basename, dirname } from "std/path/mod.ts";
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
  ToolConfig,
} from "../config/mod.ts";
import {
  fetchLatestReleaseTag,
  fetchReleasedArtifactURLs,
} from "../github/mod.ts";
import { getPackageDir } from "../path.ts";
import { State, ToolState } from "../state/mod.ts";
import { InstallationState, View } from "../view/mod.ts";

type InstallationStateUpdateHandler = (state: InstallationState) => void;

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
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

  for (const { from, to } of renames) {
    const entries = expandGlob(from, {
      root: packageDir,
      includeDirs: true,
    });

    for await (const { path: fromPath } of entries) {
      const toPath = `${packageDir}/${to}`;

      await Deno.mkdir(dirname(toPath), { recursive: true });
      await Deno.rename(fromPath, toPath);
    }
  }
}

function defaultExecutables(
  _user: string,
  repo: string,
): ReadonlyArray<ExecutableConfig> {
  return [
    { glob: `**/${repo}`, as: repo },
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

  for (const { glob, exclude, as } of executables) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const { path } of entries) {
      bin[as ?? basename(path)] = path;
    }
  }

  if (config.onDownload !== undefined) {
    await config.onDownload({
      name: config.name,
      tag,
      packageDir,
      bin,
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
  _user: string,
  _repo: string,
): ReadonlyArray<CompletionConfig> {
  return [
    { glob: `**/_*`, exclude: ["**/_*.*"] },
  ];
}

async function linkCompletions(
  config: ToolConfig,
  user: string,
  repo: string,
  packageDir: string,
  completionsDir: string,
  onUpdate: InstallationStateUpdateHandler,
): Promise<void> {
  onUpdate({ type: "linking_completions" });

  const files: Record<string, string> = {};

  const completions = config.completions ??
    defaultCompletions(user, repo);

  for (const { glob, exclude, as } of completions) {
    const entries = expandGlob(glob, {
      root: packageDir,
      includeDirs: false,
      exclude: exclude !== undefined ? [...exclude] : undefined,
    });
    for await (const { path } of entries) {
      files[as ?? basename(path)] = path;
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
    { glob: `**/*.[1-9]` },
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
      files[basename(path)] = path;
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
