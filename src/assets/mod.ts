import { basename, dirname } from "std/path/mod.ts";

export type OS = typeof Deno.build.os;
export type Arch = typeof Deno.build.arch;

export function findAssetURL(
  assetURLs: ReadonlyArray<string>,
  os: OS,
  arch: Arch,
): string | undefined {
  type MatchRule = {
    pattern: RegExp;
    score: number;
  };

  const minScore = 200;

  const rules: MatchRule[] = [
    // Ignore junk files
    {
      pattern: /(sha256|\.apk|\.deb|\.msi|\.rpm|\.sh|\.txt)$/i,
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

export async function downloadAsset(
  assetURL: string,
  destinationPath: string,
): Promise<void> {
  const res = await fetch(assetURL);
  if (!res.ok) {
    throw new Error(`Failed to download asset from '${assetURL}'`);
  }

  await Deno.mkdir(dirname(destinationPath), { recursive: true });
  const file = await Deno.open(destinationPath, { create: true, write: true });
  await res.body?.pipeTo(file.writable);
}

type ArchiveType = ".tar.gz" | ".zip";

function getArchiveTypeFromPath(archivePath: string): ArchiveType | null {
  const filename = basename(archivePath);
  if (filename.endsWith(".tar.gz")) {
    return ".tar.gz";
  } else if (filename.endsWith(".zip")) {
    return ".zip";
  }
  return null;
}

async function runCommand(
  cmd: string,
  ...args: string[]
): Promise<Deno.CommandOutput> {
  return await new Deno.Command(cmd, {
    args,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
}

export async function extractArchive(archivePath: string): Promise<string> {
  const archiveType = getArchiveTypeFromPath(archivePath);
  if (archiveType === null) {
    return archivePath;
  }

  const destinationPath = archivePath.slice(0, -archiveType.length);
  switch (archiveType) {
    case ".tar.gz": {
      await Deno.mkdir(destinationPath, { recursive: true });

      const { success } = await runCommand(
        "tar",
        "-zxf",
        archivePath,
        "-C",
        destinationPath,
      );
      if (!success) {
        throw new Error(`Failed to extract '${archivePath}'`);
      }

      break;
    }

    case ".zip": {
      const { success } = await runCommand(
        "unzip",
        "-joq",
        archivePath,
        "-d",
        destinationPath,
      );
      if (!success) {
        throw new Error(`Failed to extract '${archivePath}'`);
      }

      break;
    }

    default:
      archiveType satisfies never;
      throw new Error(`Unknown archive type '${archivePath}'`);
  }

  return destinationPath;
}
