import {
  assertEquals,
  assertRejects,
  assertSpyCalls,
  stub,
} from "../deps/std/testing.ts";
import {
  fetchLatestReleaseTag,
  fetchReleasedArtifactURLs,
  GITHUB_BASE_URL,
} from "./releases.ts";

function spyFetch(
  expectedMethod: string,
  expectedURL: string,
  response: Response,
) {
  return stub(
    globalThis,
    "fetch",
    (input, init) => {
      assertEquals(input, expectedURL);
      assertEquals(init?.method ?? "GET", expectedMethod);
      return Promise.resolve(response);
    },
  );
}

Deno.test(async function testFetchLatestReleaseTag(t) {
  await t.step("should fetch latest release tag", async () => {
    const fetchStub = spyFetch(
      "GET",
      `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/latest`,
      Response.redirect(
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/tag/v0.1.0-preview+8`,
      ),
    );

    try {
      const tag = await fetchLatestReleaseTag("Ryooooooga", "qwy");
      assertEquals(tag, "v0.1.0-preview+8");

      assertSpyCalls(fetchStub, 1);
    } finally {
      fetchStub.restore();
    }
  });

  await t.step("throws if error", async () => {
    const fetchStub = spyFetch(
      "GET",
      `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/latest`,
      Response.error(),
    );

    try {
      await assertRejects(() => fetchLatestReleaseTag("Ryooooooga", "qwy"));

      assertSpyCalls(fetchStub, 1);
    } finally {
      fetchStub.restore();
    }
  });
});

Deno.test(async function testFetchReleasedArtifactURLs(t) {
  await t.step("should fetch released artifact URLs", async () => {
    const html = await Deno.readFile(
      new URL(
        "./testdata/releases_expanded_assets_v0.1.0-preview+8.html",
        import.meta.url,
      ),
    );

    const fetchStub = spyFetch(
      "GET",
      `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/expanded_assets/v0.1.0-preview%2B8`,
      new Response(html),
    );

    try {
      const urls = await fetchReleasedArtifactURLs(
        "Ryooooooga",
        "qwy",
        "v0.1.0-preview+8",
      );

      assertEquals(urls, [
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_checksums.txt`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_darwin_amd64.tar.gz`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_darwin_arm64.tar.gz`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_amd64.tar.gz`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_arm64.tar.gz`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_linux_i386.tar.gz`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_windows_amd64.zip`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_windows_arm64.zip`,
        `${GITHUB_BASE_URL}/Ryooooooga/qwy/releases/download/v0.1.0-preview%2B8/qwy_0.1.0-preview+8_windows_i386.zip`,
      ]);
    } finally {
      fetchStub.restore();
    }
  });
});
