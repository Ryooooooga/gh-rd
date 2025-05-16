# gh-rd

GitHub Releases binaries installer.

## Requirements

- [Deno](https://deno.com/) v2.3 or later
- (tar)
- (unzip)

## Installation

```sh
$ curl -fsSL https://deno.land/x/gh_rd/install.bash | /bin/bash
$ export PATH="${XDG_DATA_HOME:-$HOME/.local/share}/gh-rd/bin:$PATH"
$ export FPATH="${XDG_DATA_HOME:-$HOME/.local/share}/gh-rd/completions:$FPATH"
$ export MANPATH="${XDG_DATA_HOME:-$HOME/.local/share}/gh-rd/man:$MANPATH" # optional
```

Install as [`gh`](https://github.com/cli/cli) extension:

```sh
$ gh extension install Ryooooooga/gh-rd
$ export PATH="${XDG_DATA_HOME:-$HOME/.local/share}/gh-rd/bin:$PATH"
$ export FPATH="${XDG_DATA_HOME:-$HOME/.local/share}/gh-rd/completions:$FPATH"
$ export MANPATH="${XDG_DATA_HOME:-$HOME/.local/share}/gh-rd/man:$MANPATH" # optional
```

## Usage

`~/.config/gh-rd/config.ts`:

```ts
import { defineConfig } from "https://deno.land/x/gh_rd/mod.ts";

export default defineConfig({
  tools: [
    {
      name: "junegunn/fzf",
    },
    {
      name: "BurntSushi/ripgrep",
      executables: [
        { glob: "**/rg", as: "rg" },
      ],
    },
    {
      name: "direnv/direnv",
      rename: [
        { from: "direnv*", to: "direnv" },
      ],
    },
    {
      name: "sharkdp/bat",
      completions: [
        { glob: "*/autocomplete/bat.zsh", as: "_bat" },
      ],
    },
    {
      name: "cli/cli",
      async onDownload({ bin: { gh }, $ }) {
        await $`${gh} completion --shell zsh >_gh`;
      },
    },
  ],
});
```

```sh
$ gh-rd
Installing junegunn/fzf...
Installing BurntSushi/ripgrep...
Installing direnv/direnv...
Installing sharkdp/bat...
Installing cli/cli...
...

$ where fzf
<home>/.local/share/gh-rd/bin/fzf
```

## Related projects

- [zdharma-continuum/zinit](https://github.com/zdharma-continuum/zinit)
- [redraw/gh-install](https://github.com/redraw/gh-install)
