# 📚 Book Notes Capstone

A full-stack web application built with **Node.js, Express, PostgreSQL,
EJS, and Axios** that allows users to store, manage, and review books
they have read.

This project demonstrates:

-   PostgreSQL database persistence
-   Full CRUD operations
-   Public API integration (Open Library Covers API)
-   Server-side rendering with EJS
-   Sorting and filtering book entries

------------------------------------------------------------------------

## 🚀 Features

-   Add new books with title, author, rating, review, and date read
-   Edit existing entries
-   Delete books
-   Sort books by:
    -   Rating
    -   Recency
    -   Title
-   Automatically fetch book cover images using the Open Library Covers
    API
-   Persistent storage using PostgreSQL

------------------------------------------------------------------------

## 🛠 Tech Stack

-   Node.js
-   Express.js
-   PostgreSQL
-   pg (node-postgres)
-   Axios
-   EJS
-   HTML/CSS

------------------------------------------------------------------------

## 📦 Installation

### 1️⃣ Clone the repository

``` bash
git clone <your-repo-url>
cd booknotes-capstone
```

------------------------------------------------------------------------

### 2️⃣ Install dependencies

``` bash
npm install
```

------------------------------------------------------------------------

### 3️⃣ Setup PostgreSQL Database

Create a new database:

``` sql
CREATE DATABASE booknotes;
```

Connect to it and create the books table:

``` sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    isbn TEXT UNIQUE,
    date_read DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

------------------------------------------------------------------------

### 4️⃣ Setup Environment Variables

Create a `.env` file in the root directory:

    DB_USER=your_postgres_username
    DB_HOST=localhost
    DB_NAME=booknotes
    DB_PASSWORD=your_postgres_password
    DB_PORT=5432

Make sure you have `dotenv` installed and required in your project.

------------------------------------------------------------------------

## ▶️ Running the Application

### Development mode (recommended)

``` bash
npm run dev
```

Or manually:

``` bash
nodemon index.js
```

### Production mode

``` bash
npm start
```

Then open your browser and go to:

    http://localhost:3000

------------------------------------------------------------------------

## 🌍 API Integration

This project integrates with the **Open Library Covers API** to fetch
book cover images.

Example cover URL format:

    https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg

Documentation: https://openlibrary.org/dev/docs/api/covers

------------------------------------------------------------------------

## 🔄 CRUD Operations

  Operation   Route
  ----------- ------------------
  Create      POST /add
  Read        GET /
  Update      POST /edit/:id
  Delete      POST /delete/:id

All operations interact directly with the PostgreSQL database.

------------------------------------------------------------------------

## 📂 Project Structure

    booknotes-capstone/
    │
    ├── public/             # Static files (CSS)
    ├── views/              # EJS templates
    ├── index.js            # Main server file
    ├── package.json
    ├── .env
    └── README.md

------------------------------------------------------------------------

## ⚠️ Error Handling

-   Database errors are caught using try/catch blocks.
-   Duplicate ISBN entries are prevented via UNIQUE constraint.
-   Invalid ratings are restricted using CHECK constraints.

------------------------------------------------------------------------

## 👨‍💻 Author

Thuan Nguyen\
Arizona State University\
Software Engineering

------------------------------------------------------------------------

## 📜 License

This project is for educational purposes.

------------------------------------------------------------------------

# ✅ Submission Checklist

-   Database persistence working
-   CRUD operations functional
-   Sorting implemented
-   API integration complete
-   README included
-   Project pushed to GitHub
