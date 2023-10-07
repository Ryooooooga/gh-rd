import { basename } from "std/path/mod.ts";

const archiveTypes = [".tar.gz", ".zip"] as const;

type ArchiveType = typeof archiveTypes[number];

function getArchiveTypeFromPath(archivePath: string): ArchiveType | undefined {
  const filename = basename(archivePath);
  return archiveTypes.find((type) => filename.endsWith(type));
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

export async function extractArchive(
  archivePath: string,
  destinationPath: string,
) {
  await Deno.mkdir(destinationPath, { recursive: true });

  const archiveType = getArchiveTypeFromPath(archivePath);
  switch (archiveType) {
    case undefined: {
      await Deno.copyFile(
        archivePath,
        `${destinationPath}/${basename(archivePath)}`,
      );
      break;
    }

    case ".tar.gz": {
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
}
