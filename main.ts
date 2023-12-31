import { loadConfig } from "./src/config/mod.ts";
import { installAllPackages } from "./src/packages/mod.ts";
import { getBinDir, getCompletionsDir, getManualsDir } from "./src/path.ts";
import { loadState, saveState } from "./src/state/mod.ts";
import { withTempDir } from "./src/utils/temp.ts";
import { createView } from "./src/view/mod.ts";

const config = await loadConfig();
const state = await loadState();

const success = withTempDir(
  "gh-rd-",
  async (tempDir) => {
    const { success, newState } = await installAllPackages(
      tempDir,
      getBinDir(),
      getCompletionsDir(),
      getManualsDir(),
      config,
      state,
      createView(),
    );
    await saveState(newState);
    return success;
  },
);

if (!success) {
  Deno.exit(1);
}
