#!/bin/bash

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
g++ "$PROJECT_DIR/client_mac.cpp" -o "$PROJECT_DIR/client_mac"
echo "export PATH=\$PATH:$(pwd)" >> ~/.bashrc
echo "alias instaRS='$PROJECT_DIR/instaRS.sh'" >> ~/.bashrc
echo "alias instaRS='$PROJECT_DIR/instaRS.sh'" >> ~/.zshrc
chmod +x instaRS.sh
chmod +x "$PROJECT_DIR/instaRS.sh"
source ~/.bashrc
source ~/.zshrc