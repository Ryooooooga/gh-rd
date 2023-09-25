import { assertEquals } from "std/assert/assert_equals.ts";
import { stub } from "std/testing/mock.ts";
import {
  getBinDir,
  getConfigPath,
  getPackageDir,
  getPackagesDir,
  getStatePath,
} from "./path.ts";

function spyEnvGet(
  env: Partial<Record<string, string>>,
) {
  return stub(
    Deno.env,
    "get",
    (key) => env[key],
  );
}

Deno.test(async function testPaths(t) {
  type Test = {
    description: string;
    env: Partial<Record<string, string>>;
    fn: () => string;
    extected: string;
  };

  const tests: ReadonlyArray<Test> = [
    // getConfigPath
    {
      description: 'getConfigPath returns "$GHRD_CONFIG_FILE" if set',
      env: {
        GHRD_CONFIG_FILE: "/home/alan/.ghrd/config.ts",
        GHRD_CONFIG_HOME: "/home/alan/.config/gh-rd",
        XDG_CONFIG_HOME: "/home/alan/.config",
        HOME: "/home/alan",
      },
      fn: getConfigPath,
      extected: "/home/alan/.ghrd/config.ts",
    },
    {
      description: 'getConfigPath returns "$GHRD_CONFIG_HOME/config.ts" if set',
      env: {
        GHRD_CONFIG_HOME: "/home/alan/.ghrd",
        XDG_CONFIG_HOME: "/home/alan/.config",
        HOME: "/home/alan",
      },
      fn: getConfigPath,
      extected: "/home/alan/.ghrd/config.ts",
    },
    {
      description:
        'getConfigPath returns "$XDG_CONFIG_HOME/gh-rd/config.ts" if set',
      env: {
        XDG_CONFIG_HOME: "/home/alan/Library/Application Support",
        HOME: "/home/alan",
      },
      fn: getConfigPath,
      extected: "/home/alan/Library/Application Support/gh-rd/config.ts",
    },
    {
      description:
        'getConfigPath returns "$HOME/.config/gh-rd/config.ts" if by default',
      env: {
        HOME: "/home/alan",
      },
      fn: getConfigPath,
      extected: "/home/alan/.config/gh-rd/config.ts",
    },
    // getBinDir
    {
      description: 'getBinDir returns "$GHRD_DATA_HOME/bin" if set',
      env: {
        GHRD_DATA_HOME: "/home/alan/.ghrd",
        XDG_DATA_HOME: "/home/alan/.local/share",
        HOME: "/home/alan",
      },
      fn: getBinDir,
      extected: "/home/alan/.ghrd/bin",
    },
    {
      description: 'getBinDir returns "$XDG_DATA_HOME/gh-rd/bin" if set',
      env: {
        XDG_DATA_HOME: "/home/alan/Library/Application Support",
        HOME: "/home/alan",
      },
      fn: getBinDir,
      extected: "/home/alan/Library/Application Support/gh-rd/bin",
    },
    {
      description:
        'getBinDir returns "$HOME/.local/share/gh-rd/bin" if by default',
      env: {
        HOME: "/home/alan",
      },
      fn: getBinDir,
      extected: "/home/alan/.local/share/gh-rd/bin",
    },
    // getPackagesDir
    {
      description: 'getPackagesDir returns "$GHRD_DATA_HOME/packages" if set',
      env: {
        GHRD_DATA_HOME: "/home/alan/.ghrd",
        XDG_DATA_HOME: "/home/alan/.local/share",
        HOME: "/home/alan",
      },
      fn: getPackagesDir,
      extected: "/home/alan/.ghrd/packages",
    },
    {
      description:
        'getPackagesDir returns "$XDG_DATA_HOME/gh-rd/packages" if set',
      env: {
        XDG_DATA_HOME: "/home/alan/Library/Application Support",
        HOME: "/home/alan",
      },
      fn: getPackagesDir,
      extected: "/home/alan/Library/Application Support/gh-rd/packages",
    },
    {
      description:
        'getPackagesDir returns "$HOME/.local/share/gh-rd/packages" if by default',
      env: {
        HOME: "/home/alan",
      },
      fn: getPackagesDir,
      extected: "/home/alan/.local/share/gh-rd/packages",
    },
    // getPackageDir
    {
      description:
        'getPackageDir returns "${getPackagesDir()}/github.com/${user}/${repo}"',
      env: {
        HOME: "/home/alan",
      },
      fn: () => getPackageDir("Ryooooooga", "croque"),
      extected:
        `/home/alan/.local/share/gh-rd/packages/github.com/Ryooooooga/croque`,
    },
    // getStatePath
    {
      description: 'getStatePath returns "$GHRD_STATE_FILE" if set',
      env: {
        GHRD_STATE_FILE: "/home/alan/.ghrd/state.yaml",
        GHRD_STATE_HOME: "/home/alan/.local/state/gh-rd",
        XDG_STATE_HOME: "/home/alan/.local/state",
        HOME: "/home/alan",
      },
      fn: getStatePath,
      extected: "/home/alan/.ghrd/state.yaml",
    },
    {
      description: 'getStatePath returns "$GHRD_STATE_HOME/state.yaml" if set',
      env: {
        GHRD_STATE_HOME: "/home/alan/.ghrd",
        XDG_STATE_HOME: "/home/alan/.local/state",
        HOME: "/home/alan",
      },
      fn: getStatePath,
      extected: "/home/alan/.ghrd/state.yaml",
    },
    {
      description:
        'getStatePath returns "$XDG_STATE_HOME/gh-rd/state.yaml" if set',
      env: {
        XDG_STATE_HOME: "/home/alan/Library/Application Support",
        HOME: "/home/alan",
      },
      fn: getStatePath,
      extected: "/home/alan/Library/Application Support/gh-rd/state.yaml",
    },
    {
      description:
        'getStatePath returns "$HOME/.local/state/gh-rd/state.yaml" if by default',
      env: {
        HOME: "/home/alan",
      },
      fn: getStatePath,
      extected: "/home/alan/.local/state/gh-rd/state.yaml",
    },
  ];

  for (const test of tests) {
    await t.step(test.description, () => {
      const envGetSpy = spyEnvGet(test.env);
      try {
        assertEquals(test.fn(), test.extected);
      } finally {
        envGetSpy.restore();
      }
    });
  }
});
