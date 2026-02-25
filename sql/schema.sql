CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  date_read DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- unique ISBN but allow multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS books_isbn_unique
ON books (isbn)
WHERE isbn IS NOT NULL;