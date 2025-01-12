#!/bin/bash

# Get the current directory of the script
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to start the server in a new terminal window
start_server() {
    #npx ts-node "$PROJECT_DIR/server.ts" &
    osascript -e "tell app \"Terminal\" to do script \"cd $PROJECT_DIR && npx ts-node tests/example.spec.ts\""

}

# Function to start the client after a delay in a new terminal window
start_client() {
    
    osascript -e "tell app \"Terminal\" to do script \"cd $PROJECT_DIR && ./client_mac\""
}

# Main function to start the server and client
main() {
    start_server
    start_client
}

# Run the main function
main
