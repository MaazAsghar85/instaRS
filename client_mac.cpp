#include <iostream>
#include <string>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <pthread.h>
#include <fstream>
#include <vector>
using namespace std;

void* receiveMessages(void* arg) {
    //std::cout<<"thread created successfully...\n";
    int sock = *(int*)arg;
    char buffer[1024];
    int bytesReceived;
    while (true) {
        bytesReceived = recv(sock, buffer, sizeof(buffer), 0);
        if (bytesReceived == -1) {
            std::cerr << "recv failed\n";
            close(sock);
            return nullptr;
        }
        if (bytesReceived == 0) {
            std::cout << "Server disconnected\n";
            close(sock);
            return nullptr;
        }
        buffer[bytesReceived] = '\0'; // Null-terminate the received data
        std::cout << "Error: " << buffer << std::endl;
    }
    return nullptr;
}

int main() {
    int i=0;
    L:
    int sock = 0;
    struct sockaddr_in serv_addr;

    if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
        std::cerr << "\n Socket creation error \n";
        return -1;
    }

    serv_addr.sin_family = AF_INET;
    serv_addr.sin_port = htons(8080);

    // Convert IPv4 and IPv6 addresses from text to binary form
    if(inet_pton(AF_INET, "127.0.0.1", &serv_addr.sin_addr)<=0) {
        std::cerr << "\nInvalid address/ Address not supported \n";
        return -1;
    }
   

    if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
        // std::cerr << "\nConnection Failed \n";
        sleep(1);
        if(i<10){
            i++;
            goto L;
            
        }
        return -1;
    }

    // Create a thread to receive messages from the server
    pthread_t receiveThread;
    if (pthread_create(&receiveThread, nullptr, receiveMessages, &sock) != 0) {
        std::cerr << "Error creating thread\n";
        return -1;
    }

    // Main thread for sending messages
    std::string message;
    while (true) {
        std::cout << "instaRS >> ";
        std::getline(std::cin, message);

        if (message == "quit") break;
        else if (message == "--list"){
            cout<<endl;
            cout << "===================== instaRS Command Console =====================\n\n";

            cout << "Browser and Page Management:\n";
            cout << "   lb                    - Launch new browser\n";
            cout << "   lp                    - Launch new page\n";
            cout << "   cb [browser num]      - Close browser (default: active browser)\n";
            cout << "   cp [page num]         - Close page (default: active page)\n";
            cout << "   sap [page num]        - Set active page\n";
            cout << "   sab [browser num]     - Set active browser\n";
            cout << "   lsb                   - List all browsers\n";
            cout << "   lsp                   - List all pages\n\n";

            cout << "Session and Environment Management:\n";
            cout << "   senv                  - Set environment\n";
            cout << "   lenv                  - Load environment\n";
            cout << "   scook [filename]      - Save browser cookies to a file\n";
            cout << "   lcook [filename]      - Load browser cookies from a file\n";
            cout << "   set sleep [num]       - Sets the sleep for the current session\n\n";

            cout << "Instagram Functionalities:\n";
            cout << "   login [user][pass]    - Log in to Instagram with provided credentials\n";
            cout << "   search [username]     - Search specified Instagram user\n";
            cout << "   goto [link]           - Navigate to specified URL\n\n";

            cout << "Data Management Commands:\n";
            cout << "   dump [option]         - Download user data based on the option:\n";
            cout << "      -max               - All user data including Followers/Following\n";
            cout << "      -a                 - All user data excluding Followers/Following\n";
            cout << "      -t                 - All text-related data\n";
            cout << "      -m                 - All media-related data\n";
            cout << "      -p                 - Profile Picture only\n";
            cout << "      -u                 - User Data only\n";
            cout << "      -pt                - Post text (Captions, Comments, etc)\n";
            cout << "      -pm                - Post Media (Images)\n";
            cout << "      -r                 - Reels\n";
            cout << "      -h                 - Highlights\n";
            cout << "      -fr [num]          - Num of Followers usernames, e.g., 100\n";
            cout << "      -fg [num]          - Num of Following usernames, e.g., 100\n";
            cout << "      -fru               - User Data of extracted Followers\n";
            cout << "      -fgu               - User Data of extracted Following\n";
            cout << "      -frp               - Profile Pic of extracted Followers\n";
            cout << "      -fgp               - Profile Pic of extracted Following\n\n";

            cout << "Utility Commands:\n";
            cout << "   ss [filename]         - Save screenshot of active page in given filename\n";
            cout << "   --list                - List all commands\n";
            cout << "   quit                  - Close instaRS console\n\n";

            cout << "===================================================================\n\n";
        }
        else if (message == "ls") {
            std::ifstream file("script.txt");
            std::vector <std::string> lines;
            std::string line;

            if (file.is_open()) {
                while (getline(file, line)) {
                    lines.push_back(line);
                }
                file.close();
            }
            else std::cout << "Unable to open file" << std::endl;

            for (const auto & command : lines) {
                std::cout << "instaRS >> ";
                std::cout << command << std::endl;
                send(sock, command.c_str(), command.length(), 0);
                sleep(1);
            }
            continue;
        }

        send(sock, message.c_str(), message.length(), 0);
        //std::cout << "Command sent\n";
        // sleep(1);
    }

    // Cleanup
    close(sock);

    // Wait for the receive thread to finish
    pthread_join(receiveThread, nullptr);

    return 0;
}
