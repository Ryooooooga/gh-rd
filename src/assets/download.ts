import { dirname } from "std/path/mod.ts";

export async function downloadReleasedAsset(
  assetURL: string,
  destinationPath: string,
) {
  const res = await fetch(assetURL);
  if (!res.ok) {
    throw new Error(`Failed to download asset '${assetURL}'`);
  }

  await Deno.mkdir(dirname(destinationPath), { recursive: true });
  const file = await Deno.open(destinationPath, { create: true, write: true });
  await res.body?.pipeTo(file.writable);
}
