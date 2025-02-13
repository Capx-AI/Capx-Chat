# Capx‑Chat

**Capx‑Chat** is a chat application built with Node.js, Express, and Supabase using TypeScript. It provides user authentication, dynamic chat session management, and a modular architecture designed for scalability and ease of maintenance.

---

## Table of Contents

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

2. **Build the Project**

   ```bash
   npm run build
   ```

3. **Start the Server (Development Mode)**

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

- **Get Current User**  
  **Endpoint:** `GET /app/users/`  
  **Description:** Retrieves the current user’s data (requires a valid session token).

### Chat Operations

- **Create Chat**  
  **Endpoint:** `POST /app/chat/`  
  **Description:** Initializes a new chat session.  
  **Example:**

  ```bash
  curl --location 'http://localhost:3000/app/chat/' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer your-jwt-token' \
  --data '{
      "data": {
          "model": "gpt-4o",
          "provider": "OpenAI",
          "chat_id": null,
          "text": "What is 2+4"
      }
  }'
  ```

- **Delete Chat**  
  **Endpoint:** `POST /app/chat/delete`  
  **Description:** Deletes an existing chat session (authorization required).

- **Edit Chat Prompt**  
  **Endpoint:** `POST /app/chat/editPrompt`  
  **Description:** Updates the prompt text of an ongoing chat session.

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