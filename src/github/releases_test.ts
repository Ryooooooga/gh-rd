import { assertEquals, assertRejects } from "std/assert/mod.ts";
import { assertSpyCalls } from "std/testing/mock.ts";
import { fetchLatestReleaseTag, GITHUB_BASE_URL } from "./releases.ts";
import { spyFetch } from "./test.ts";

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
