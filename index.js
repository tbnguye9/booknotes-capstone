const express = require("express");
const axios = require("axios");
const methodOverride = require("method-override");
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set("view engine", "ejs");

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static("public"));

/**
 * Covers
 * Use internal endpoint (axios checks if cover exists, else fallback to /no-cover.png)
 * This avoids broken images when ISBN is invalid.
 */
function coverProxyUrl(isbn) {
  if (!isbn) return "/no-cover.jpg";
  return `/api/covers/isbn/${encodeURIComponent(isbn)}`;
}

function normalizeIsbn(isbnRaw) {
  if (!isbnRaw) return null;
  // keep digits and X (ISBN-10 might end with X)
  const cleaned = String(isbnRaw)
    .trim()
    .replace(/[^0-9Xx]/g, "")
    .toUpperCase();
  return cleaned.length ? cleaned : null;
}

function normalizeRating(r) {
  if (r === undefined || r === null || r === "") return null;
  const n = Number(r);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}

/**
 * API Integration requirement:
 * GET endpoint that uses Axios to interact with Open Library Covers API.
 * It returns the image if found; otherwise 404 (frontend uses fallback).
 */
app.get("/api/covers/isbn/:isbn", async (req, res) => {
  const { isbn } = req.params;
  const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg`;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      // Open Library may return jpeg/png/gif; default safe:
      res.set("Content-Type", response.headers["content-type"] || "image/jpeg");
      return res.send(response.data);
    }

    return res.status(404).json({ message: "Cover not found", isbn });
  } catch (e) {
    console.error("Cover fetch failed:", e.message);
    return res.status(500).json({ message: "Failed to fetch cover" });
  }
});

// HOME: list + sorting + search
// /?sort=recent|rating_desc|rating_asc|title&q=keyword
app.get("/", async (req, res, next) => {
  try {
    const sort = req.query.sort || "recent";
    const q = (req.query.q || "").trim();

    let orderBy = "date_read DESC NULLS LAST, created_at DESC";
    if (sort === "rating_desc")
      orderBy = "rating DESC NULLS LAST, date_read DESC NULLS LAST";
    if (sort === "rating_asc")
      orderBy = "rating ASC NULLS LAST, date_read DESC NULLS LAST";
    if (sort === "title") orderBy = "title ASC";

    let sql = `SELECT * FROM books`;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      sql += ` WHERE title ILIKE $1 OR author ILIKE $2`;
    }

    sql += ` ORDER BY ${orderBy}`;

    const result = await db.query(sql, params);

    const books = result.rows.map((b) => ({
      ...b,
      cover_url: coverProxyUrl(b.isbn),
    }));

    res.render("index", { books, sort, q });
  } catch (err) {
    next(err);
  }
});

// NEW form
app.get("/books/new", (req, res) => {
  res.render("new");
});

// CREATE
app.post("/books", async (req, res) => {
  const title = (req.body.title || "").trim();
  const author = (req.body.author || "").trim();
  const isbn = normalizeIsbn(req.body.isbn);
  const rating = normalizeRating(req.body.rating);
  const notes = req.body.notes ? String(req.body.notes) : null;
  const date_read = req.body.date_read || null;

  if (!title || !author) {
    return res.status(400).render("error", {
      title: "Validation Error",
      message: "Title and Author are required.",
      backHref: "/books/new",
    });
  }

  // If user typed rating but invalid -> show error
  if (req.body.rating && rating === null) {
    return res.status(400).render("error", {
      title: "Validation Error",
      message: "Rating must be an integer from 1 to 5.",
      backHref: "/books/new",
    });
  }

  try {
    await db.query(
      `INSERT INTO books (title, author, isbn, rating, notes, date_read)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, author, isbn, rating, notes, date_read],
    );
    res.redirect("/");
  } catch (e) {
    // Unique ISBN violation
    if (e.code === "23505") {
      return res.status(409).render("error", {
        title: "Duplicate ISBN",
        message:
          "This ISBN already exists in your database. Try a different ISBN or leave it blank.",
        backHref: "/books/new",
      });
    }

    console.error(e);
    return res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to create the book.",
      backHref: "/books/new",
    });
  }
});

// SHOW
app.get("/books/:id", async (req, res) => {
  const { id } = req.params;
  const result = await db.query("SELECT * FROM books WHERE id=$1", [id]);
  const book = result.rows[0];

  if (!book) {
    return res.status(404).render("error", {
      title: "Not Found",
      message: "Book not found.",
      backHref: "/",
    });
  }

  book.cover_url = coverProxyUrl(book.isbn);
  res.render("show", { book });
});

// EDIT form
app.get("/books/:id/edit", async (req, res) => {
  const { id } = req.params;
  const result = await db.query("SELECT * FROM books WHERE id=$1", [id]);
  const book = result.rows[0];

  if (!book) {
    return res.status(404).render("error", {
      title: "Not Found",
      message: "Book not found.",
      backHref: "/",
    });
  }

  res.render("edit", { book });
});

// UPDATE
app.put("/books/:id", async (req, res) => {
  const { id } = req.params;

  const title = (req.body.title || "").trim();
  const author = (req.body.author || "").trim();
  const isbn = normalizeIsbn(req.body.isbn);
  const rating = normalizeRating(req.body.rating);
  const notes = req.body.notes ? String(req.body.notes) : null;
  const date_read = req.body.date_read || null;

  if (!title || !author) {
    return res.status(400).render("error", {
      title: "Validation Error",
      message: "Title and Author are required.",
      backHref: `/books/${id}/edit`,
    });
  }

  if (req.body.rating && rating === null) {
    return res.status(400).render("error", {
      title: "Validation Error",
      message: "Rating must be an integer from 1 to 5.",
      backHref: `/books/${id}/edit`,
    });
  }

  try {
    await db.query(
      `UPDATE books
       SET title=$1, author=$2, isbn=$3, rating=$4, notes=$5, date_read=$6
       WHERE id=$7`,
      [title, author, isbn, rating, notes, date_read, id],
    );

    res.redirect(`/books/${id}`);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).render("error", {
        title: "Duplicate ISBN",
        message:
          "This ISBN already exists in your database. Try a different ISBN or leave it blank.",
        backHref: `/books/${id}/edit`,
      });
    }

    console.error(e);
    return res.status(500).render("error", {
      title: "Server Error",
      message: "Failed to update the book.",
      backHref: `/books/${id}/edit`,
    });
  }
});

// DELETE
app.delete("/books/:id", async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM books WHERE id=$1", [id]);
  res.redirect("/");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Check server logs.",
    backHref: "/",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
