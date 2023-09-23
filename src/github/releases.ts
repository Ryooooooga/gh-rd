import { DOMParser } from "deno_dom/deno-dom-wasm.ts";

export const GITHUB_BASE_URL = "https://github.com";

function getRepositoryPath(user: string, repo: string): string {
  return `/${encodeURIComponent(user)}/${encodeURIComponent(repo)}`;
}

function getRepositoryURL(user: string, repo: string): string {
  return `${GITHUB_BASE_URL}${getRepositoryPath(user, repo)}`;
}

function getLatestReleaseURL(user: string, repo: string): string {
  return `${getRepositoryURL(user, repo)}/releases/latest`;
}

function getExpandedAssetsURL(user: string, repo: string, tag: string): string {
  return `${getRepositoryURL(user, repo)}/releases/expanded_assets/${
    encodeURIComponent(tag)
  }`;
}

export async function fetchLatestReleaseTag(
  user: string,
  repo: string,
): Promise<string> {
  const res = await fetch(getLatestReleaseURL(user, repo), {
    redirect: "manual",
  });
  if (res.status !== 302) {
    throw new Error(`Failed to fetch latest release of '${user}/${repo}'`);
  }

  const releaseBaseURL = `${getRepositoryURL(user, repo)}/releases/tag/`;
  const redirectURL = res.headers.get("location");
  if (redirectURL === null || !redirectURL.startsWith(releaseBaseURL)) {
    throw new Error(`Unexpected release URL '${redirectURL}'`);
  }

  return redirectURL.slice(releaseBaseURL.length);
}

export async function fetchReleasedArtifactURLs(
  user: string,
  repo: string,
  tag: string,
): Promise<ReadonlyArray<string>> {
  const res = await fetch(getExpandedAssetsURL(user, repo, tag));
  if (!res.ok) {
    throw new Error(`Failed to fetch released assets of '${user}/${repo}'`);
  }

  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (doc === null) {
    throw new Error(`Failed to fetch released assets of '${user}/${repo}'`);
  }

  const downloadBasePath = `${
    getRepositoryPath(user, repo)
  }/releases/download/`;

  const anchors = doc.getElementsByTagName("a");

  const assetPaths = anchors.map((a) => a.getAttribute("href"))
    .filter((href): href is string => href !== null)
    .filter((path) => path.startsWith(downloadBasePath));
  return assetPaths.map((path) => `${GITHUB_BASE_URL}${path}`);
}
