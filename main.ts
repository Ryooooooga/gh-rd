#!/usr/bin/env -S deno run --no-check --allow-read --allow-write --allow-net --allow-env --allow-run
import {
  downloadAsset,
  extractArchive,
  findAssetURL,
} from "./src/assets/mod.ts";
import {
  fetchLatestReleaseTag,
  fetchReleasedArtifactURLs,
} from "./src/github/releases.ts";

async function download(name: string) {
  console.log(`Installing ${name}...`);
  const [user, repo] = name.split("/");

  const tag = await fetchLatestReleaseTag(user, repo);
  const assetsURLs = await fetchReleasedArtifactURLs(user, repo, tag);
  const assetURL = findAssetURL(assetsURLs, Deno.build.os, Deno.build.arch);

  if (assetURL !== undefined) {
    const filename = `dist/${assetURL.split("/").pop()!}`;
    console.log(`  Downloading ${assetURL} to ${filename}...`);
    await downloadAsset(assetURL, filename);
    console.log(`  Extracting ${filename}...`);
    await extractArchive(filename, `dist/${user}---${repo}`);
  }
}
const tools = [
  // "direnv/direnv",
  // "Ryooooooga/zabrze",
  // "dandavison/delta",
  // "itchyny/mmv",
  // "BurntSushi/ripgrep",
  // "x-motemen/ghq",
  // "jesseduffield/lazygit",
  // "Ryooooooga/zouch",
  // "Ryooooooga/monkeywrench",
  // "cli/cli",
  // "eza-community/eza",
  // "mikefarah/yq",
  // "rhysd/hgrep",
  // "denisidoro/navi",
  // "Ryooooooga/qwy",
  // "dbrgn/tealdeer",
  // "himanoa/mdmg",
  "Ryooooooga/croque",
];

await Promise.all(tools.map((name) => download(name)));
