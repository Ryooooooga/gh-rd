#!/usr/bin/env -S deno run --no-check --no-lock --allow-read --allow-write --allow-net --allow-env --allow-run
import { basename } from "std/path/basename.ts";
import {
  findExecutables,
  linkExecutable,
  loadConfig,
  loadState,
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
import { getBinDir, getPackageDir } from "./src/path.ts";
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
): Promise<ToolState> {
  console.log(`Installing ${tool.name}...`);

  const segments = tool.name.split("/");
  if (segments.length !== 2) {
    throw new Error("Invalid tool name");
  }
  const [user, repo] = segments;
  const packageDir = getPackageDir(user, repo);

  const tag = tool.tag ?? await fetchLatestReleaseTag(user, repo);
  if (installedTag === tag && await fileExists(packageDir)) {
    console.log(`  Already installed ${tag}`);
    return {
      name: tool.name,
      tag,
    };
  }

  const assetsURLs = await fetchReleasedArtifactURLs(user, repo, tag);
  const assetURL = findAssetURL(assetsURLs, Deno.build.os, Deno.build.arch);
  if (assetURL === undefined) {
    throw new Error("No asset found");
  }

  const filename = `${tempDir}/${basename(assetURL)}`;
  console.log(`  Downloading ${assetURL}...`);
  await downloadAsset(assetURL, filename);
  console.log(`  Extracting ${basename(filename)}...`);
  await extractArchive(filename, packageDir);

  const executables = await findExecutables(
    user,
    repo,
    packageDir,
    tool.executables,
  );
  await linkExecutable(executables, getBinDir());

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

  const newToolStates = await Promise.all(
    config.tools.map((tool) =>
      download(tempDir, tool, installedTagMap.get(tool.name))
    ),
  );

  newToolStates.sort((a, b) => a.name.localeCompare(b.name));
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
