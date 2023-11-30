import { basename } from "../deps/std/path.ts";

const archiveTypes = [".tar.gz", ".tar.xz", ".zip"] as const;

type ArchiveType = typeof archiveTypes[number];

function getArchiveTypeFromPath(archivePath: string): ArchiveType | undefined {
  const filename = basename(archivePath);
  return archiveTypes.find((type) => filename.endsWith(type));
}

type RunCommand = typeof runCommand;

async function runCommand(
  cmd: string,
  ...args: string[]
): Promise<Deno.CommandStatus> {
  return await new Deno.Command(cmd, {
    args,
    stdout: "inherit",
    stderr: "inherit",
  }).output();
}

type CopyFile = typeof Deno.copyFile;
type Mkdir = typeof Deno.mkdir;

export async function extractArchive(
  archivePath: string,
  destinationPath: string,
  runCommandFn: RunCommand = runCommand,
  mkdirFn: Mkdir = Deno.mkdir,
  copyFileFn: CopyFile = Deno.copyFile,
) {
  await mkdirFn(destinationPath, { recursive: true });

  const archiveType = getArchiveTypeFromPath(archivePath);
  switch (archiveType) {
    case undefined: {
      await copyFileFn(
        archivePath,
        `${destinationPath}/${basename(archivePath)}`,
      );
      break;
    }

    case ".tar.gz": {
      const { success } = await runCommandFn(
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

    case ".tar.xz": {
      const { success } = await runCommandFn(
        "tar",
        "-Jxf",
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
      const { success } = await runCommandFn(
        "unzip",
        "-oq",
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
