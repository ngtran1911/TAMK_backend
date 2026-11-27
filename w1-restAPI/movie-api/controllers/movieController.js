const pool = require("../db");

function validateMovie(body, isStrict = true) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  // title
  if (isStrict && body.title === undefined) {
    errors.push("title is required");
  }
  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    errors.push("title must be a non-empty string");
  }

  // director
  if (isStrict && body.director === undefined) {
    errors.push("director is required");
  }
  if (
    body.director !== undefined &&
    (typeof body.director !== "string" || body.director.trim().length === 0)
  ) {
    errors.push("director must be a non-empty string");
  }

  // year
  if (isStrict && body.year === undefined) {
    errors.push("year is required");
  }
  if (
    body.year !== undefined &&
    (!Number.isInteger(body.year) ||
      body.year < 1888 ||
      body.year > maximumYear)
  ) {
    errors.push("year must be a valid integer");
  }

  return errors;
}
// Read the id from the URL. Returns a positive integer, or null if invalid.
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function sendInvalidId(res) {
  return res.status(400).json({
    error: { code: "INVALID_ID", message: "id must be a positive integer" },
  });
}

function sendNotFound(res) {
  return res.status(404).json({
    error: { code: "MOVIE_NOT_FOUND", message: "Movie not found" },
  });
}

function sendValidationError(res, details) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Movie data is invalid",
      details,
    },
  });
}
// The columns every query returns. release_year AS year keeps the API's "year".
const MOVIE_COLUMNS = "id, title, director, release_year AS year";

async function getMovies(req, res, next) {
  try {
    const { director, minYear, sortBy } = req.query;

    const conditions = []; // WHERE parts, e.g. "release_year >= $1"
    const values = []; // values for the $1, $2… placeholders

    // director: case-insensitive, partial match ("nolan" matches "Christopher Nolan")
    if (director !== undefined) {
      values.push(`%${director}%`);
      conditions.push(`director ILIKE $${values.length}`);
    }

    // minYear: must be an integer
    if (minYear !== undefined) {
      const minYearNumber = Number(minYear);
      if (!Number.isInteger(minYearNumber)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY_PARAMETER",
            message: "minYear must be an integer",
          },
        });
      }
      values.push(minYearNumber);
      conditions.push(`release_year >= $${values.length}`);
    }

    // sortBy: strict allow-list. Column names can't be $ parameters,
    // so only names from this server-defined list can reach the SQL text.
    const sortColumns = {
      id: "id",
      year: "release_year",
      title: "title",
    };
    let orderBy = "id";
    if (sortBy !== undefined) {
      if (!Object.hasOwn(sortColumns, sortBy)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY_PARAMETER",
            message: "sortBy must be id, year or title",
          },
        });
      }
      orderBy = sortColumns[sortBy];
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT ${MOVIE_COLUMNS}
       FROM movies
       ${where}
       ORDER BY ${orderBy}`,
      values,
    );

    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
}

async function getMovieById(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return sendInvalidId(res);

    const result = await pool.query(
      `SELECT ${MOVIE_COLUMNS}
       FROM movies
       WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) return sendNotFound(res);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function addMovie(req, res, next) {
  try {
    const body = req.body ?? {};
    const errors = validateMovie(body, true);
    if (errors.length > 0) return sendValidationError(res, errors);

    const { title, director, year } = body;

    const result = await pool.query(
      `INSERT INTO movies (title, director, release_year)
       VALUES ($1, $2, $3)
       RETURNING ${MOVIE_COLUMNS}`,
      [title, director, year],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function replaceMovie(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return sendInvalidId(res);

    const body = req.body ?? {};
    const errors = validateMovie(body, true);
    if (errors.length > 0) return sendValidationError(res, errors);

    const { title, director, year } = body;

    const result = await pool.query(
      `UPDATE movies
       SET title = $1, director = $2, release_year = $3
       WHERE id = $4
       RETURNING ${MOVIE_COLUMNS}`,
      [title, director, year, id],
    );

    // no row updated → the movie doesn't exist
    if (result.rows.length === 0) return sendNotFound(res);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function updateMovie(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return sendInvalidId(res);

    const body = req.body ?? {};
    const errors = validateMovie(body, false);
    if (errors.length > 0) return sendValidationError(res, errors);

    // allow-list: API field name → database column name.
    // Only these server-defined names can become part of the SQL text.
    const allowedFields = {
      title: "title",
      director: "director",
      year: "release_year",
    };

    const setClauses = []; // e.g. "release_year = $1"
    const values = [];

    for (const [field, column] of Object.entries(allowedFields)) {
      if (body[field] !== undefined) {
        values.push(body[field]);
        setClauses.push(`${column} = $${values.length}`);
      }
    }

    // empty body (or only unknown fields) → nothing to update
    if (setClauses.length === 0) {
      return sendValidationError(res, [
        "at least one of title, director or year is required",
      ]);
    }

    values.push(id); // the id is always the last placeholder

    const result = await pool.query(
      `UPDATE movies
       SET ${setClauses.join(", ")}
       WHERE id = $${values.length}
       RETURNING ${MOVIE_COLUMNS}`,
      values,
    );

    if (result.rows.length === 0) return sendNotFound(res);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

async function deleteMovie(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (id === null) return sendInvalidId(res);

    const result = await pool.query(
      `DELETE FROM movies
       WHERE id = $1
       RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) return sendNotFound(res);

    res.status(204).send(); // no JSON body with 204
  } catch (error) {
    next(error);
  }
}
module.exports = {
  getMovieById,
  getMovies,
  addMovie,
  replaceMovie,
  updateMovie,
  deleteMovie,
};
