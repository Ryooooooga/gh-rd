#!/usr/bin/env -S deno run --no-check --allow-read --allow-write --allow-net --allow-env
import { basename } from "std/path/mod.ts";
import { DOMParser } from "deno_dom/deno-dom-wasm.ts";

export const GITHUB_BASE_URL = "https://github.com";

export type OS = typeof Deno.build.os;
export type Arch = typeof Deno.build.arch;

export function getDownloadURL(
  assetURLs: ReadonlyArray<string>,
  os: OS,
  arch: Arch,
): string | undefined {
  const patterns: RegExp[] = [];

  switch (os) {
    case "darwin":
      patterns.push(/apple-darwin|apple|darwin|dmg|mac-?(os)?|osx/i);
      break;
    case "linux":
      patterns.push(/linux/i);
      break;
    case "windows":
      patterns.push(/windows/i);
      break;
    default:
      throw new Error(`Unsupported OS: ${os}`);
  }

  switch (arch) {
    case "x86_64":
      patterns.push(/amd64|x86_64|x64/i);
      break;
    case "aarch64":
      patterns.push(/arm(-|64)|aarch64/i);
      break;
    default:
      arch satisfies never;
      throw new Error(`Unsupported Arch: ${arch}`);
  }

  const junk = /(sha256|\.apk|\.deb|\.msi|\.rpm|\.sh|\.txt)$/i;

  const downloadURL = assetURLs.find((url) =>
    patterns.every((pattern) => {
      const filename = basename(url);
      return filename.match(pattern) !== null && !filename.match(junk);
    })
  );

  return downloadURL;
}

function getRepoPath(user: string, repo: string): string {
  return `/${encodeURIComponent(user)}/${
    encodeURIComponent(
      repo,
    )
  }`;
}

export async function fetchLatestReleaseTag(
  user: string,
  repo: string,
): Promise<string> {
  const repoPath = getRepoPath(user, repo);
  const releaseBaseURL = `${GITHUB_BASE_URL}${repoPath}/releases/tag/`;
  const latestReleaseURL = `${GITHUB_BASE_URL}${repoPath}/releases/latest`;

  const res = await fetch(latestReleaseURL);
  if (!res.redirected) {
    throw new Error(`Failed to fetch latest release of '${user}/${repo}'`);
  }

  if (!res.url.startsWith(releaseBaseURL)) {
    throw new Error(`Unexpected release URL '${res.url}'`);
  }

  return res.url.slice(releaseBaseURL.length);
}

export async function fetchReleaseArtifactURLs(
  user: string,
  repo: string,
  tag: string,
): Promise<ReadonlyArray<string>> {
  const repoPath = getRepoPath(user, repo);
  const assetsURL = `${GITHUB_BASE_URL}${repoPath}/releases/expanded_assets/${
    encodeURIComponent(tag)
  }`;

  const html = await fetch(assetsURL).then((res) => res.text());
  const doc = new DOMParser().parseFromString(html, "text/html");
  const anchors = doc?.getElementsByTagName("a") ?? [];

  return anchors.map((a) => a.getAttribute("href"))
    .filter((href): href is string => typeof href === "string")
    .filter((path) =>
      path.startsWith(
        `${repoPath}/releases/download/`,
      )
    ).map((path) => `${GITHUB_BASE_URL}${path}`);
}
