import { dirname } from "std/path/mod.ts";

export async function downloadAsset(
  assetURL: string,
  destinationPath: string,
) {
  const res = await fetch(assetURL);
  if (!res.ok) {
    throw new Error(`Failed to download asset from '${assetURL}'`);
  }

  await Deno.mkdir(dirname(destinationPath), { recursive: true });
  const file = await Deno.open(destinationPath, { create: true, write: true });
  await res.body?.pipeTo(file.writable);
}
