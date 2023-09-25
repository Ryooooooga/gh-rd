#!/usr/bin/env bash
if ! command -v git >/dev/null 2>&1; then
  echo "git is required to install gh-rd" >&2
  exit 1
fi

set -eu

export GHRD_DATA_HOME="${GHRD_DATA_HOME:-${XDG_DATA_HOME:-${HOME}/.local/share}/gh-rd}"

if [[ -d "${GHRD_DATA_HOME}/src" ]]; then
  echo "gh-rd is already installed"
  git -C "${GHRD_DATA_HOME}/src" pull
  exit 0
fi

git clone https://github.com/Ryooooooga/gh-rd "${GHRD_DATA_HOME}/src"
mkdir -p "${GHRD_DATA_HOME}/bin"
ln -sf "${GHRD_DATA_HOME}/src/gh-rd" "${GHRD_DATA_HOME}/bin/gh-rd"
