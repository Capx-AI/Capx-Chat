# Capx‑Chat

**Capx‑Chat** is a chat application built with Node.js, Express, and Supabase using TypeScript. It provides user authentication, dynamic chat session management, and a modular architecture designed for scalability and ease of maintenance.

---

## Table of Contents

- [Capx‑Chat](#capxchat)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Supabase Setup](#supabase-setup)
    - [Installation](#installation)
    - [Running with Docker](#running-with-docker)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [Chat Operations](#chat-operations)
  - [Project Structure](#project-structure)
  - [Additional Information](#additional-information)
    - [Error Handling](#error-handling)
    - [Testing](#testing)
    - [Contributing](#contributing)
  - [License](#license)

---

## Overview

Capx‑Chat is designed to offer a seamless chatting experience. The application leverages Supabase for backend storage and authentication, while its modular structure helps maintain clean, testable, and scalable code. Whether you are creating a new chat session or managing an existing one, Capx‑Chat ensures a smooth operation.

---

## Features

- **User Authentication**  
  - Secure sign up and login using Supabase.
  - Management of user metadata and login tokens.

- **Chat Management**  
  - Create, delete, and edit chat sessions.
  - Dynamic prompt updating with input validation.

- **Modular Architecture**  
  - Separation of concerns with dedicated modules (e.g., authentication, controllers, environment handlers).
  - Easy to extend and maintain.

- **Database & Environment Configuration**  
  - Supabase handles persistent data storage.
  - Database tables and triggers defined in SQL scripts.
  - Sensitive credentials stored securely in `.env` files.

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or later.
- **Supabase**: A project account along with the project URL and API key.

### Supabase Setup

1. **Create a Supabase Project**  
   Visit [Supabase](https://supabase.com) and create a new project.

2. **Database Initialization**  
   Run the SQL script located at `src/init/db.sql` in your Supabase instance to set up necessary tables and triggers.

3. **Environment Variables**  
   - Copy `.env-sample` to `.env`.
   - Update values such as `SUPABASE_URL` and `SUPABASE_KEY`.

### Installation
1. **Install Dependencies**

  ```bash
  npm install
  ```

2. **Start the Server (Development Mode)**

  ```bash
  npm run dev
  ```

3. **Build the Project**

  ```bash
  npm run build
  ```



4. **Start the Server (Production Mode - from built files)**

  ```bash
  npm start
  ```

### Running with Docker

For a production-ready container setup that includes Redis cache (if configured), use:

```bash
docker build -t capx-chat .
docker run -p 3000:3000 capx-chat
```

---

## API Endpoints

### Authentication

- **Sign Up / Login**  
  **Endpoint:** `POST /app/users/auth`  
  **Description:** Verifies user credentials or creates a new account.  
  **Example:**

  ```bash
  curl -X POST http://localhost:3000/app/users/auth \
      -H "Content-Type: application/json" \
      -d '{
          "email": "user@example.com",
          "password": "your-password",
          "first_name": "John",
          "last_name": "Doe",
          "username": "johndoe"
      }'
  ```

  **Response Schema:**

  ```json
  {
    "user": {
      "id": "1f272808-8733-4008-8f53-671e338e3fbc",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe"
    },
    "session": {
      "access_token": "<your-jwt-token>",
      "refresh_token": "<your-jwt-refresh-token>",
      "token_type": "bearer"
    }
  }
  ```

- **Get Current User**  
  **Endpoint:** `GET /app/users/`  
  **Description:** Retrieves the current user’s data (requires a valid session token).

  **Example:**

  ```bash
  curl --location 'http://localhost:3000/app/users/' \
  --header 'Authorization: Bearer <your-jwt-token>'
  ```

  **Response Schema:**

  ```json
  {
      "user": {
          "id": "1f272808-8733-4008-8f53-671e338e3fbc",
          "email": "user@example.com",
          "first_name": "John",
          "last_name": "Doe",
          "username": "johndoe"
      }
  }
  ```

### Chat Operations
- **Get Chat Overview**  
  **Endpoint:** `GET /app/chat/overview`  
  **Description:** Retrieves an overview of all chat sessions associated with the current user, including segmented chat history, available providers with their models, and the user's current credit balance.

  **Example:**

  ```bash
  curl --location 'http://localhost:3000/app/chat/overview' \
       --header 'Authorization: Bearer <your-jwt-token>'
  ```

  **Response Schema:**

  ```json
  {
    "result": {
        "success": true,
        "message": "User overview data retrieved successfully",
        "chat_history": {
            "today_chats": [
                {
                    "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b",
                    "title": "What is 2+4",
                    "model": "gpt-4o",
                    "provider": "OpenAI",
                    "updated_at": "2025-02-13T17:54:00.66136+00:00",
                    "model_name": "GPT 4o"
                }
            ],
            "previous_day_chats": [],
            "other_chats": []
        },
        "user_credits": 999.167875,
        "providers": [
            {
                "name": "Capx",
                "icon": "Capx",
                "models": [
                    {
                        "name": "Gemini 1.5 Flash",
                        "model": "gemini-1.5-flash",
                        "min_credits": 4,
                        "provider": "capx"
                    }
                ]
            },
            {
                "name": "OpenAI",
                "icon": "ChatGpt",
                "models": [
                    {
                        "name": "GPT 4o Mini",
                        "model": "gpt-4o-mini",
                        "min_credits": 8,
                        "provider": "openai"
                    },
                    {
                        "name": "GPT 4o",
                        "model": "gpt-4o",
                        "min_credits": 125,
                        "provider": "openai"
                    }
                ]
            },
            {
                "name": "Anthropic",
                "icon": "Claude",
                "models": [
                    {
                        "name": "Claude 3.5 Sonnet",
                        "model": "claude-3-5-sonnet-20240620",
                        "min_credits": 180,
                        "provider": "anthropic"
                    }
                ]
            },
            {
                "name": "Meta",
                "icon": "Meta",
                "models": [
                    {
                        "name": "Llama 3.1 8b",
                        "model": "meta-llama/Meta-Llama-3-8B-Instruct-Turbo",
                        "min_credits": 4,
                        "provider": "meta"
                    }
                ]
            }
        ]
    }
  }
  ```

  - **Create Chat**  
  **Endpoint:** `POST /app/chat/`  
  **Description:** Initializes a new chat session.  
  **Example:**

  ```bash
  curl --location 'http://localhost:3000/app/chat/' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <your-jwt-token>' \
  --data '{
      "data": {
          "model": "gpt-4o",
          "provider": "OpenAI",
          "chat_id": null,
          "text": "What is 2+4"
      }
  }'
  ```

  **Response Schema:**

  ```json
  {
    "result": {
      "success": true,
      "message": "Success",
      "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b",
      "conversation_id": "45e7a957-5a47-46bf-b8e3-49a761fd8f28",
      "generated_text": "2 + 4 equals 6.",
      "credits_utilised": 0.128625,
      "provider": "OpenAI",
      "model": "gpt-4o",
      "title": "What is 2+4"
    }
  }
  ```

- **Continue Chat**  
    **Endpoint:** `POST /app/chat/`  
    **Description:** Continues an existing chat session by including a previously generated `chat_id`.  
    **Example:**

    ```bash
    curl --location 'http://localhost:3000/app/chat/' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: Bearer <your-jwt-token>' \
      --data '{
          "data": {
              "model": "gpt-4o",
              "provider": "OpenAI",
              "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b", // <chat_id from create chat>
              "text": "continue the conversation"
          }
      }'
    ```

    **Response Schema:**

    ```json
    {
      "result": {
        "success": true,
        "message": "Success",
        "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b",
        "conversation_id": "cf9c88fa-cda8-40ab-8602-5fd60500fbdd",
        "generated_text": "9 + 5 equals 14.", 
        "credits_utilised": 0.189,
        "provider": "OpenAI",
        "model": "gpt-4o",
        "title": "What is 2+4"
      }
    }
    ```
- **Retrieve Chat History**  
    **Endpoint:** `GET /app/chat`  
    **Description:** Retrieves the full chat history for a specific chat session. The endpoint requires a `chat_id` query parameter and accepts an optional `timestamp` query parameter. When provided, the timestamp filters records to those created before that time (using the value from `next_timestamp`).

    **Example:**
    ```bash
    curl --location "http://localhost:3000/app/chat?chat_id=f5ddc591-78a1-4640-b90b-220748d547c0" \
    --header "Authorization: Bearer <your-jwt-token>"
    ```

    **Optional Timestamp:**
    ```bash
    curl --location "http://localhost:3000/app/chat?timestamp=2024-10-07T18%3A03%3A53.836392%2B00%3A00&chat_id=f5ddc591-78a1-4640-b90b-220748d547c0" \
    --header "Authorization: Bearer <your-jwt-token>"
    ```

    **Response Schema:**
    ```json
    {
      "result": {
        "success": true,
        "message": "Successfully retrieved chat history",
        "chat_id": "f5ddc591-78a1-4640-b90b-220748d547c0",
        "provider": "OpenAI",
        "model": "gpt-4o",
        "previous_history": [
          {
            "conversation_id": "56ce2c15-91a0-4d00-a2be-68d9c0bd6d91",
            "conversation_created_at": "2025-02-13T17:54:00.66136+00:00",
            "model": "gpt-4o",
            "provider": "OpenAI",
            "message_data": {
              "user": {
                "chat_id": "f5ddc591-78a1-4640-b90b-220748d547c0",
                "message": "What is 10+4",
                "created_at": "2025-02-13T17:54:00.66136+00:00",
                "message_id": "21cc1ed0-9f32-42c7-a1a2-4344f1aeb728",
                "sender_role": "user"
              },
              "assistant": {
                "chat_id": "f5ddc591-78a1-4640-b90b-220748d547c0",
                "message": "10 + 4 equals 14.",
                "created_at": "2025-02-13T17:54:00.66136+00:00",
                "message_id": "d904f9e2-84bd-4adb-872f-2ee5c59afb3c",
                "sender_role": "assistant"
              }
            }
          }
        ],
        "next_timestamp": null
      }
    }
    ```

- **Delete Chat**  
  **Endpoint:** `POST /app/chat/delete`  
  **Description:** Deletes an existing chat session (authorization required).

  **Example:**

  ```bash
  curl --location 'http://localhost:3000/app/chat/delete' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <your-jwt-token>' \
  --data '{
      "data": {
          "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b"
      }
  }'
  ```

  **Response Schema:**

  ```json
  {
    "result": {
      "success": true,
      "message": "Chat successfully deleted.",
      "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b"
    }
  }
  ```

- **Edit Chat Prompt**  
  **Endpoint:** `POST /app/chat/editPrompt`  
  **Description:** Updates the prompt text of an ongoing chat session.

  **Example:**

  ```bash
  curl --location 'http://localhost:3000/app/chat/editPrompt' \
      --header 'Content-Type: application/json' \
      --header 'Authorization: Bearer <your-jwt-token>' \
      --data '{
          "data": {
              "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b",
              "text": "Remember the number 10.",
              "conversation_id": "cf9c88fa-cda8-40ab-8602-5fd60500fbdd"
          }
      }'
  ```

  **Response Schema:**

  ```json
  {
    "result": {
      "success": true,
      "message": "Success",
      "chat_id": "3a27e504-fbb1-45a7-ba79-81683442fa4b",
      "generated_text": "Got it, I'll remember the number 10 for our conversation. Let me know if there's anything specific you'd like to do with it!",
      "credits_utilised": 0.385875,
      "provider": "OpenAI",
      "model": "gpt-4o",
      "new_conversation_id": "f659f484-79aa-44f7-9458-ca8fc841534e",
      "edited_conversation_id": "cf9c88fa-cda8-40ab-8602-5fd60500fbdd"
    }
  }
  ```

---

## Project Structure

The project is organized into modular components for clarity and scalability. Below is an overview of the structure:

```plaintext
.
├── .env
├── .env-sample
├── .eslintrc.js
├── dockerfile
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
├── secrets.json
├── sample-secrets.json
├── src
│   ├── app.ts
│   ├── config.ts
│   ├── init
│   │   ├── db.sql
│   │   ├── dbSchema.ts
│   │   ├── env.ts
│   │   ├── secretManager.ts
│   │   └── supabase.ts
│   ├── middlewares
│   │   ├── auth.ts
│   │   ├── errorHandler
│   │   │   └── index.ts
│   │   └── validateSchema
│   │       └── index.ts
│   ├── servers
│   │   ├── chat
│   │   │   ├── controllers
│   │   │   ├── constructors
│   │   │   ├── modifiers
│   │   │   ├── types
│   │   │   ├── index.ts
│   │   │   └── validators
│   │   └── users
│   │       └── index.ts
│   └── types
│       ├── express
│       │   └── index.d.ts
│       └── index.ts
```

---

## Additional Information

### Error Handling

- Comprehensive logging and input validation are implemented across all endpoints to ensure reliability and maintainability.

### Testing

- Users are encouraged to integrate additional test scripts to support continuous integration and thorough application testing.

### Contributing

- Contributions are welcome! Please fork the repository and submit a pull request with your improvements or bug fixes.
- Follow the established code style and structure when contributing to ensure consistency.

---

## License

This project is licensed under the terms detailed in the included [LICENSE](./LICENSE) file.