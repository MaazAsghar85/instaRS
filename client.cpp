#define _WIN32_WINNT 0x0601
#include <winsock2.h>
#include <ws2tcpip.h>
#include <iostream>
#include <unistd.h>
#include <sstream>
#include <fstream>
#include <string>
#include <vector>

#pragma comment(lib, "Ws2_32.lib")
using namespace std;

DWORD WINAPI receiveThreadFunc(LPVOID lpParameter) {
    SOCKET sock = reinterpret_cast<SOCKET>(lpParameter);
    char buffer[1024];
    int bytesReceived;
    while (true) {
        bytesReceived = recv(sock, buffer, sizeof(buffer), 0);
        if (bytesReceived == SOCKET_ERROR) {
            std::cerr << "recv failed: " << WSAGetLastError() << std::endl;
            closesocket(sock);
            WSACleanup();
            return 1;
        }
        if (bytesReceived == 0) {
            std::cout << "Server disconnected" << std::endl;
            closesocket(sock);
            WSACleanup();
            return 0;
        }
        buffer[bytesReceived] = '\0'; // Null-terminate the received data
        std::cout << "Received from server: " << buffer << std::endl;
    }
}

int main() {
    int i = 0;
    L:

    WSADATA wsaData;
    SOCKET sock = INVALID_SOCKET;
    struct addrinfo* result = nullptr, * ptr = nullptr, hints;
    int iResult;

    // Initialize Winsock
    iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
        std::cerr << "WSAStartup failed: " << iResult << std::endl;
        return 1;
    }

    ZeroMemory(&hints, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_protocol = IPPROTO_TCP;

    // Resolve the server address and port
    iResult = getaddrinfo("127.0.0.1", "8080", &hints, &result);
    if (iResult != 0) {
        std::cerr << "getaddrinfo failed: " << iResult << std::endl;
        WSACleanup();
        return 1;
    }

    // Attempt to connect to an address until one succeeds
    for (ptr = result; ptr != nullptr; ptr = ptr->ai_next) {
        // Create a SOCKET for connecting to server
        sock = socket(ptr->ai_family, ptr->ai_socktype, ptr->ai_protocol);
        if (sock == INVALID_SOCKET) {
            std::cerr << "Socket failed: " << WSAGetLastError() << std::endl;
            WSACleanup();
            return 1;
        }

        // Connect to server
        iResult = connect(sock, ptr->ai_addr, static_cast<int>(ptr->ai_addrlen));
        if (iResult != SOCKET_ERROR) {
            break; // Successfully connected
        }

        closesocket(sock);
        sock = INVALID_SOCKET;
    }

    freeaddrinfo(result);

    if (sock == INVALID_SOCKET) {
        // std::cerr << "Unable to connect to server!" << std::endl;
        sleep(1);
        if (i < 10) {
            i++;
            goto L;
        }
        WSACleanup();
        return 1;
    }

    // Start a thread to receive messages from the server
    HANDLE receiveThreadHandle = CreateThread(NULL, 0, receiveThreadFunc, reinterpret_cast<LPVOID>(sock), 0, NULL);
    if (receiveThreadHandle == NULL) {
        std::cerr << "Failed to create receive thread" << std::endl;
        closesocket(sock);
        WSACleanup();
        return 1;
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
                iResult = send(sock, command.c_str(), static_cast<int>(command.length()), 0);
                if (iResult == SOCKET_ERROR) {
                    std::cerr << "Send failed: " << WSAGetLastError() << std::endl;
                    closesocket(sock);
                    WSACleanup();
                    return 1;
                }
                sleep(3);
            }
            continue;
        }

        iResult = send(sock, message.c_str(), static_cast<int>(message.length()), 0);
        if (iResult == SOCKET_ERROR) {
            std::cerr << "Send failed: " << WSAGetLastError() << std::endl;
            closesocket(sock);
            WSACleanup();
            return 1;
        }
    }

    // Cleanup
    closesocket(sock);
    WSACleanup();

    // Wait for the receive thread to finish
    WaitForSingleObject(receiveThreadHandle, INFINITE);
    CloseHandle(receiveThreadHandle);

    return 0;
}

// g++ client.cpp -o client -lws2_32