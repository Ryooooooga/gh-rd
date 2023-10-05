import { basename } from "std/path/basename.ts";
import {
  findCompletions,
  findExecutables,
  linkCompletion,
  linkExecutable,
  loadConfig,
  loadState,
  renameFiles,
  saveState,
} from "./src/mod.ts";
import {
  downloadAsset,
  extractArchive,
  findAssetURL,
} from "./src/assets/mod.ts";
import { Config, ToolConfig } from "./src/config.ts";
import {
  fetchLatestReleaseTag,
  fetchReleasedArtifactURLs,
} from "./src/github/releases.ts";
import { getBinDir, getCompletionsDir, getPackageDir } from "./src/path.ts";
import { State, ToolState } from "./src/state.ts";

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch (_err) {
    return false;
  }
}

async function download(
  tempDir: string,
  tool: ToolConfig,
  installedTag: string | undefined,
): Promise<ToolState | undefined> {
  if (tool.enabled === false) {
    console.log(`Skipping ${tool.name}...`);
    return undefined;
  }

  console.log(`Installing ${tool.name}...`);

  const segments = tool.name.split("/");
  if (segments.length !== 2) {
    throw new Error("Invalid tool name");
  }
  const [user, repo] = segments;
  const packageDir = getPackageDir(user, repo);

  const tag = tool.tag ?? await fetchLatestReleaseTag(user, repo);
  if (installedTag === tag && await fileExists(packageDir)) {
    console.log(`  ${tool.name}: Already installed ${tag}`);
    return {
      name: tool.name,
      tag,
    };
  }

  const assetsURLs = await fetchReleasedArtifactURLs(user, repo, tag);
  const assetURL = findAssetURL(
    assetsURLs,
    tool.use,
    Deno.build.os,
    Deno.build.arch,
  );
  if (assetURL === undefined) {
    throw new Error(`${tool.name}: No asset found`);
  }

  const filename = `${tempDir}/${basename(assetURL)}`;
  console.log(`  Downloading ${assetURL}...`);
  await downloadAsset(assetURL, filename);
  console.log(`  Extracting ${basename(filename)}...`);
  await extractArchive(filename, packageDir);

  if (tool.rename !== undefined) {
    await renameFiles(user, repo, packageDir, tool.rename);
  }

  const executables = await findExecutables(
    user,
    repo,
    packageDir,
    tool.executables,
  );

  if (tool.onDownload !== undefined) {
    await tool.onDownload({
      name: tool.name,
      tag,
      packageDir,
      bin: executables,
    }).catch((err) => {
      console.error(err);
    });
  }

  await linkExecutable(executables, getBinDir());

  const completions = await findCompletions(
    user,
    repo,
    packageDir,
    tool.completions,
  );

  await linkCompletion(completions, getCompletionsDir());

  return {
    name: tool.name,
    tag,
  };
}

async function downloadAll(
  tempDir: string,
  config: Config,
  state: State,
): Promise<State> {
  const installedTagMap = new Map(
    state.tools.map(({ name, tag }) => [name, tag]),
  );

  const newToolStates = (await Promise.all(
    config.tools.map((tool) =>
      download(tempDir, tool, installedTagMap.get(tool.name))
    ),
  )).filter((state): state is ToolState => state !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    tools: newToolStates,
  };
}

const config = await loadConfig();
const state = await loadState();

const tempDir = await Deno.makeTempDir({ prefix: "gh-rd-" });
try {
  const newState = await downloadAll(tempDir, config, state);
  await saveState(newState);
} finally {
  try {
    await Deno.remove(tempDir, { recursive: true });
  } catch (err) {
    console.error(err);
  }
}
