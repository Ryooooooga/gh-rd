#!/usr/bin/env -S deno run --no-check --allow-read --allow-write --allow-net --allow-env
import { basename } from "std/path/mod.ts";

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
