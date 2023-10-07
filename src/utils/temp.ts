export async function withTempDir<T>(
  prefix: string,
  f: (tempDir: string) => Promise<T>,
): Promise<T> {
  const tempDir = await Deno.makeTempDir({ prefix });
  try {
    return await f(tempDir);
  } finally {
    await Deno.remove(tempDir, { recursive: true })
      .catch((err) => {
        console.error(err);
      });
  }
}
