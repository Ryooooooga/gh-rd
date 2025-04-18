import { defineConfig } from "../mod.ts";

export default defineConfig({
  shell: "zsh",
  tools: [
    {
      name: "rossmacarthur/sheldon",
    },
    {
      name: "Ryooooooga/croque",
      async onDownload({ bin: { croque }, $ }) {
        await $`${croque} init zsh >croque.zsh`;
      },
    },
    {
      name: "Ryooooooga/zabrze",
      async onDownload({ bin: { zabrze }, $ }) {
        await $`${zabrze} init --bind-keys >zabrze.zsh`;
      },
    },
    {
      name: "Ryooooooga/qwy",
      async onDownload({ bin: { qwy }, $ }) {
        await $`${qwy} init >qwy.zsh`;
      },
    },
    {
      name: "Ryooooooga/zouch",
    },
    {
      name: "Ryooooooga/monkeywrench",
    },
    {
      name: "direnv/direnv",
      rename: [
        { from: "direnv*", to: "direnv", chmod: 0o755 },
      ],
      async onDownload({ bin: { direnv }, $ }) {
        await $`${direnv} hook zsh >direnv.zsh`;
      },
    },
    {
      name: "dandavison/delta",
    },
    {
      name: "itchyny/mmv",
    },
    {
      name: "BurntSushi/ripgrep",
    },
    {
      name: "x-motemen/ghq",
    },
    {
      name: "jesseduffield/lazygit",
    },
    {
      name: "cli/cli",
      async onDownload({ bin: { gh }, $ }) {
        await $`${gh} completion --shell zsh >_gh`;
      },
    },
    {
      name: "eza-community/eza",
      enabled: Deno.build.os !== "darwin",
      async onDownload({ packageDir, $ }) {
        await $.request(
          "https://raw.githubusercontent.com/eza-community/eza/main/completions/zsh/_eza",
        ).pipeToPath(`${packageDir}/_eza`);
      },
    },
    {
      name: "mikefarah/yq",
      rename: [
        { from: "yq_*", to: "yq", chmod: 0o755 },
      ],
      async onDownload({ bin: { yq }, $ }) {
        await $`${yq} shell-completion zsh >_yq`;
      },
    },
    {
      name: "rhysd/hgrep",
      async onDownload({ bin: { hgrep }, $ }) {
        await $`${hgrep} --generate-completion-script zsh >_hgrep`;
      },
    },
    {
      name: "denisidoro/navi",
      tag: "v2.25.0-beta1",
    },
    {
      name: "tealdeer-rs/tealdeer",
      rename: [
        { from: "tealdeer*", to: "tldr", chmod: 0o755 },
      ],
      async onDownload({ packageDir, $ }) {
        await $.request(
          "https://github.com/dbrgn/tealdeer/releases/latest/download/completions_zsh",
        ).pipeToPath(`${packageDir}/_tldr`);
      },
    },
    {
      name: "himanoa/mdmg",
      executables: [
        { glob: "**/mdmg" },
      ],
      async onDownload({ packageDir, $ }) {
        await $.request(
          "https://raw.githubusercontent.com/Ryooooooga/mdmg/master/completions/mdmg.completion.zsh",
        ).pipeToPath(`${packageDir}/_mdmg`);
      },
    },
    {
      name: "junegunn/fzf",
    },
    {
      name: "sharkdp/bat",
    },
    {
      name: "sharkdp/fd",
    },
    {
      name: "XAMPPRocky/tokei",
      tag: "v12.1.2",
    },
    {
      name: "neovim/neovim",
    },
    {
      name: "ldc-developers/ldc",
      executables: [
        { glob: "**/rdmd" },
      ],
    },
    {
      name: "charmbracelet/gum",
    },
  ],
});
