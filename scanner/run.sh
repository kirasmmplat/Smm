#!/bin/bash

# Kashef Scanner Runner Script

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Check if venv exists, create if not
if [ ! -d "$HOME/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$HOME/venv"
fi

# Activate venv
source "$HOME/venv/bin/activate"

# Install requirements
echo "Checking requirements..."
pip install -r "$DIR/requirements.txt" > /dev/null

# Run the scanner
echo "Starting Kashef Scanner Engine..."
python3 "$DIR/main.py"
