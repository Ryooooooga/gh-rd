#!/usr/bin/env -S deno run --no-check --no-lock --allow-read --allow-write --allow-net --allow-env --allow-run
import { basename } from "std/path/basename.ts";
import { loadConfig } from "./src/mod.ts";
import {
  downloadAsset,
  extractArchive,
  findAssetURL,
} from "./src/assets/mod.ts";
import { ToolConfig } from "./src/config.ts";
import {
  fetchLatestReleaseTag,
  fetchReleasedArtifactURLs,
} from "./src/github/releases.ts";
import { getPackageDir } from "./src/path.ts";

const config = await loadConfig();

async function download(tempDir: string, tool: ToolConfig) {
  console.log(`Installing ${tool.name}...`);

  const segments = tool.name.split("/");
  if (segments.length !== 2) {
    throw new Error("Invalid tool name");
  }
  const [user, repo] = segments;

  const tag = tool.tag ?? await fetchLatestReleaseTag(user, repo);
  const assetsURLs = await fetchReleasedArtifactURLs(user, repo, tag);
  const assetURL = findAssetURL(assetsURLs, Deno.build.os, Deno.build.arch);

  if (assetURL !== undefined) {
    const filename = `${tempDir}/${basename(assetURL)}`;
    console.log(`  Downloading ${assetURL}...`);
    await downloadAsset(assetURL, filename);
    console.log(`  Extracting ${basename(filename)}...`);
    await extractArchive(filename, getPackageDir(user, repo));
  }
}

const tempDir = await Deno.makeTempDir({ prefix: "gh-rd-" });
try {
  await Promise.all(config.tools.map((tool) => download(tempDir, tool)));
} finally {
  try {
    await Deno.remove(tempDir, { recursive: true });
  } catch (err) {
    console.error(err);
  }
}
