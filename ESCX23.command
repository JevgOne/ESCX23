#!/bin/bash
# Dvojklik na tento soubor otevře Claude Code v projektu ESCX23
# Nastaví velké okno terminálu pro tmux 50/50 layout (leader + teammates)
cd "$(dirname "$0")"

# Resize terminal to full width (241+ cols for 50/50 split)
printf '\e[8;60;240t'

# Kill old tmux session if exists
tmux kill-session -t ESCX23 2>/dev/null

# Start fresh tmux session with large window
tmux new-session -d -s ESCX23 -x 240 -y 60

# Launch Claude Code inside tmux
tmux send-keys -t ESCX23 "cd '$(pwd)' && IS_SANDBOX=1 exec claude --dangerously-skip-permissions" Enter

# Attach to session
exec tmux attach -t ESCX23
