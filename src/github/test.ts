import { assertEquals } from "std/assert/mod.ts";
import { stub } from "std/testing/mock.ts";

export function spyFetch(
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
