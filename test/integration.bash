#!/usr/bin/env bash
set -euxo pipefail

_cputype="$(uname -m)"
case $_cputype in
  aarch64 | arm64)
    _cputype=aarch64
    ;;

  x86_64 | x86-64 | x64 | amd64)
    _cputype=x86_64
    ;;
esac

export DIR="$(cd -- "$(dirname -- "$0")" && pwd)"

export GHRD_CONFIG_FILE="$DIR/config.ts"
export GHRD_DATA_HOME="$DIR/tmp/local/share/gh-rd"
export GHRD_STATE_HOME="$DIR/tmp/local/state/gh-rd"

test-command() {
  local cmd="$1"
  [[ "$(command -v "$cmd")" = "$GHRD_DATA_HOME/bin/$cmd" ]]
}

test-completion() {
  local cmd="$1"
  [[ -f "$GHRD_DATA_HOME/completions/_$cmd" ]]
}

# Install gh-rd
if [[ -n "${GITHUB_SHA:-}" ]]; then
  /bin/bash "$DIR/../install.bash"
  git -C "$GHRD_DATA_HOME/src" switch -d "$GITHUB_SHA"

  export PATH="$GHRD_DATA_HOME/bin:$PATH"
  test-command gh-rd
else
  export PATH="$DIR/..:$GHRD_DATA_HOME/bin:$PATH"
fi

# Install binaries
gh-rd

[[ -d "$GHRD_DATA_HOME/packages" ]]
[[ -d "$GHRD_DATA_HOME/bin" ]]
[[ -d "$GHRD_DATA_HOME/completions" ]]
[[ -f "$GHRD_STATE_HOME/state.yaml" ]]

# Test binaries
{ # sheldon
  test-command sheldon
  sheldon --version
  [[ -f "$GHRD_DATA_HOME/completions/_sheldon" ]]
}
{ # croque
  test-command croque
  croque --version
  [[ -f "$GHRD_DATA_HOME/packages/github.com/Ryooooooga/croque/croque.zsh" ]]
}
{ # zabrze
  test-command zabrze
  zabrze --version
  [[ -f "$GHRD_DATA_HOME/packages/github.com/Ryooooooga/zabrze/zabrze.zsh" ]]
}
{ # qwy
  test-command qwy
  qwy --version
  [[ -f "$GHRD_DATA_HOME/packages/github.com/Ryooooooga/qwy/qwy.zsh" ]]
}
{ # zouch
  test-command zouch
  zouch --version
}
{ # monkeywrench
  test-command monkeywrench
  monkeywrench --version
}
{ # direnv
  test-command direnv
  direnv --version
  [[ -f "$GHRD_DATA_HOME/packages/github.com/direnv/direnv/direnv.zsh" ]]
}
{ # delta
  test-command delta
  delta --version
}
{ # mmv
  test-command mmv
  mmv --version
}
{ # ripgrep
  test-command rg
  rg --version
}
{ # ghq
  test-command ghq
  test-completion ghq
  ghq --version
}
{ # lazygit
  test-command lazygit
  lazygit --version
}
{ # gh
  test-command gh
  test-completion gh
  gh --version
}
{ # eza
  if [[ "$OSTYPE" != darwin* ]]; then
    test-command eza
    test-completion eza
    eza --version
  else
    ! test-command eza
  fi
}
{ # yq
  test-command yq
  test-completion yq
  yq --version
}
{ # hgrep
  test-command hgrep
  test-completion hgrep
  hgrep --version
}
{ # navi
  test-command navi
  navi --version
}
{ # tealdeer
  test-command tldr
  test-completion tldr
  tldr --version
}
{ # mdmg
  test-command mdmg
  test-completion mdmg
  mdmg --version
}
{ # fzf
  test-command fzf
  fzf --version
}
{ # bat
  test-command bat
  test-completion bat
  bat --version
}
{ # fd
  test-command fd
  test-completion fd
  fd --version
}
{ # tokei
  test-command tokei
  tokei --version
}
{ # neovim
  if [[ "$_cputype" = x86_64 ]]; then
    test-command nvim
    nvim --version
  else
    ! test-command nvim
  fi
}
{ # ldc2
  test-command rdmd
  rdmd --help

  ! test-command ldc2
}
