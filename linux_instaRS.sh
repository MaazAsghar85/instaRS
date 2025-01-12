#!/bin/bash

# Get the current directory of the script
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to start the server in a new terminal window
start_server() {
    xterm -e "cd $PROJECT_DIR && npx ts-node tests/example.spec.ts; read -p 'Press Enter to close this window'"
}

# Function to start the client after a delay in a new terminal window
start_client() {
    xterm -e "cd $PROJECT_DIR && ./client_mac; read -p 'Press Enter to close this window'"
}

# Main function to start the server and client
main() {
    start_server &
    start_client &
}

# Run the main function
main

