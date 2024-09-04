# Chat App README

## Overview

This is a simple chat backend built for testing and learning purposes using the following technologies:

-   **[Hyper Express](https://github.com/kartikk221/hyper-express/)**: A fast web framework using [uwebsockets.js](https://github.com/uNetworking/uWebSockets.js) used to handle HTTP and WebSocket requests.
-   **Mongoose**: MongoDB object modeling tool.

The application supports basic features like private chats and group chats. There is also a model for channels, although it is not currently utilized. Additionally, the project contains a very beta feature for end-to-end (E2E) messaging. **_Please note that this project is in an experimental stage and is unlikely to receive major updates in the future._**

## Features

-   **Private Chat**: Users can send direct messages to each other.
-   **Group Chat**: Users can create groups and chat within those groups.
-   **Channel Model**: A model exists for channels, but it is not implemented in the current version.
-   **Beta E2E Messaging**: A very basic and experimental feature for end-to-end encrypted messaging.

## Installation

1. **Clone the repository**:

    ```bash
    git clone https://github.com/md-/chat-app.git
    cd chat-app
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Set up MongoDB**:
   Ensure that you have MongoDB installed and running on your system. You can configure the MongoDB connection string in the `.env` file.

4. **Configure Environment Variables**:
   Rename `.env.example` to `.env` and replace jwt secret
5. **Run the application**:

    ```bash
    npm start
    ```

    The application will start running on the port specified in your `.env` file (default is 3000).

## Usage example

**note: the postman collection and ws examples are included but might have some problems**

1. create new accounts.
2. save the jwt tokens.
3. create new ws connections .
4. send the jwt as login for ws (there is an example in wsExample).
5. create chats, send messages and so on.

## Project Structure

-   **/models**: Contains Mongoose models for Users, Messages, Groups, and Channels.
-   **/routes**: Contains route handlers for HTTP and WebSocket requests.
-   **/controllers**: Handles the main logic for chat functionalities.
-   **/utils**: Utility functions.
-   **E2E** : Test for E2E messaging.

## Known Issues

-   The E2E messaging feature is still in beta and may not function as expected.
-   Channel functionality is not implemented, even though a model exists.
-   The Protected and Restricted routes logic is broken since the original codebase was in express and some things don't work, so right now all routes are available

## Future Updates

This project is primarily for testing and learning purposes. It is unlikely to receive major updates or new features.

## License

This project is licensed under the GPL3 License. See the LICENSE file for more details.

---

Thank you for checking out this chat app! Remember, it's a learning tool, so feel free to experiment and modify it as you wish. Happy coding!
