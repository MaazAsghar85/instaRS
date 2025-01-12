#!/bin/bash

# Ensure the script is running from the correct directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Compile client_mac.cpp with pthread flag
g++ "$PROJECT_DIR/client_mac.cpp" -o "$PROJECT_DIR/client_mac" -pthread

# Add the directory to PATH in both bashrc and zshrc
echo "export PATH=\$PATH:$PROJECT_DIR" >> ~/.bashrc
echo "export PATH=\$PATH:$PROJECT_DIR" >> ~/.zshrc

# Define an alias for instaRS in both bashrc and zshrc
echo "alias instaRS='$PROJECT_DIR/linux_instaRS.sh'" >> ~/.bashrc
echo "alias instaRS='$PROJECT_DIR/linux_instaRS.sh'" >> ~/.zshrc

# Ensure instaRS.sh has executable permissions
chmod +x "$PROJECT_DIR/linux_instaRS.sh"

# Source the configuration files to apply changes
source ~/.bashrc
source ~/.zshrc

