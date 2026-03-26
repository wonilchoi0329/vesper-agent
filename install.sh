#!/bin/bash
set -e

REPO="https://github.com/wonilchoi0329/vesper-agent"
TMP_DIR=$(mktemp -d)

echo "Installing Vesper agent..."

git clone --depth 1 --quiet "$REPO" "$TMP_DIR"

# Copy agent and vesper folders
cp -r "$TMP_DIR/.claude" .
cp -r "$TMP_DIR/.vesper" .

# Cleanup
rm -rf "$TMP_DIR"

echo "✓ Installed .claude/agents/vesper.md"
echo "✓ Installed .vesper/"
echo ""
echo "Summon with @vesper in Claude Code"
