import { basename, globToRegExp } from "std/path/mod.ts";

export type OS = typeof Deno.build.os;
export type Arch = typeof Deno.build.arch;

export function findAssetURL(
  assetURLs: ReadonlyArray<string>,
  use: string | undefined,
  os: OS,
  arch: Arch,
): string | undefined {
  if (use !== undefined) {
    const usePattern = globToRegExp(use);
    const targetAssetURL = assetURLs.find((url) =>
      usePattern.test(basename(url))
    );
    return targetAssetURL;
  }

  type MatchRule = {
    pattern: RegExp;
    score: number;
  };

  const minScore = 200;

  const rules: MatchRule[] = [
    // Ignore junk files
    {
      pattern: /(sha256|sha256sum|\.apk|\.deb|\.msi|\.rpm|\.sh|\.txt)$/i,
      score: -10000,
    },
    // Give priority to the archive file
    {
      pattern: /\.(gz|zip)$/i,
      score: 10,
    },
  ];

  switch (os) {
    case "darwin":
      rules.push({
        pattern: /apple-darwin|apple|darwin|dmg|mac-?(os)?|osx/i,
        score: 100,
      });
      break;
    case "linux":
      rules.push({
        pattern: /linux/i,
        score: 100,
      });
      break;
    case "windows":
      rules.push({
        pattern: /windows|\.exe/i,
        score: 100,
      });
      break;
    default:
      throw new Error(`Unsupported OS: ${os}`);
  }

  switch (arch) {
    case "x86_64":
      rules.push({
        pattern: /amd64|x86_64|x64/i,
        score: 100,
      });
      break;
    case "aarch64":
      rules.push({
        pattern: /arm(-|64)|aarch64/i,
        score: 100,
      });
      break;
    default:
      arch satisfies never;
      throw new Error(`Unsupported Arch: ${arch}`);
  }

  const targetAssetURL = assetURLs
    .map((url): [string, number] => {
      const filename = basename(url);
      const score = rules.reduce((totalScore, { pattern, score }) => {
        return totalScore + (filename.match(pattern) !== null ? score : 0);
      }, 0);
      return [url, score];
    })
    .filter(([, score]) => score >= minScore)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([url]) => url)
    .find(() => true);

  return targetAssetURL;
}
