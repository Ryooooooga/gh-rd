import { assertSpyCall, assertSpyCalls, spy } from "../deps/std/testing.ts";
import { extractArchive } from "./extract.ts";

Deno.test(async function testExtractArchive(t) {
  await t.step("extracts a .tar.gz archive", async () => {
    const archivePath = "tmp/test.tar.gz";
    const destinationPath = "packages/test";

    const mockRunCommand = spy(() =>
      Promise.resolve({
        success: true,
        code: 0,
        signal: null,
      })
    );

    const mockMkdir = spy(() => Promise.resolve());
    const mockCopyFile = spy(() => Promise.resolve());

    await extractArchive(
      archivePath,
      destinationPath,
      mockRunCommand,
      mockMkdir,
      mockCopyFile,
    );

    assertSpyCall(mockRunCommand, 0, {
      args: ["tar", "-zxf", archivePath, "-C", destinationPath],
    });
    assertSpyCall(mockMkdir, 0, {
      args: [destinationPath, { recursive: true }],
    });
    assertSpyCalls(mockCopyFile, 0);
  });

  await t.step("extracts a .tar.xz archive", async () => {
    const archivePath = "tmp/test.tar.xz";
    const destinationPath = "packages/test";

    const mockRunCommand = spy(() =>
      Promise.resolve({
        success: true,
        code: 0,
        signal: null,
      })
    );

    const mockMkdir = spy(() => Promise.resolve());
    const mockCopyFile = spy(() => Promise.resolve());

    await extractArchive(
      archivePath,
      destinationPath,
      mockRunCommand,
      mockMkdir,
      mockCopyFile,
    );

    assertSpyCall(mockRunCommand, 0, {
      args: ["tar", "-Jxf", archivePath, "-C", destinationPath],
    });
    assertSpyCall(mockMkdir, 0, {
      args: [destinationPath, { recursive: true }],
    });
    assertSpyCalls(mockCopyFile, 0);
  });

  await t.step("extracts a .zip archive", async () => {
    const archivePath = "tmp/test.zip";
    const destinationPath = "packages/test";

    const mockRunCommand = spy(() =>
      Promise.resolve({
        success: true,
        code: 0,
        signal: null,
      })
    );

    const mockMkdir = spy(() => Promise.resolve());
    const mockCopyFile = spy(() => Promise.resolve());

    await extractArchive(
      archivePath,
      destinationPath,
      mockRunCommand,
      mockMkdir,
      mockCopyFile,
    );

    assertSpyCall(mockRunCommand, 0, {
      args: ["unzip", "-oq", archivePath, "-d", destinationPath],
    });
    assertSpyCall(mockMkdir, 0, {
      args: [destinationPath, { recursive: true }],
    });
    assertSpyCalls(mockCopyFile, 0);
  });

  await t.step("copy file", async () => {
    const archivePath = "tmp/test";
    const destinationPath = "packages/test";

    const mockRunCommand = spy(() =>
      Promise.resolve({
        success: true,
        code: 0,
        signal: null,
      })
    );

    const mockMkdir = spy(() => Promise.resolve());
    const mockCopyFile = spy(() => Promise.resolve());

    await extractArchive(
      archivePath,
      destinationPath,
      mockRunCommand,
      mockMkdir,
      mockCopyFile,
    );

    assertSpyCalls(mockRunCommand, 0);
    assertSpyCall(mockMkdir, 0, {
      args: [destinationPath, { recursive: true }],
    });
    assertSpyCall(mockCopyFile, 0, {
      args: [archivePath, `${destinationPath}/test`],
    });
  });
});
