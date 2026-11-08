// 1. setup
const express = require("express");
const app = express();
app.use(express.json());

// movie data store in memory
let movies = [
  { id: 1, title: "Inception", year: 2010, genre: "Sci-Fi" },
  { id: 2, title: "The Matrix", year: 1999, genre: "Sci-Fi" },
  { id: 3, title: "Parasite", year: 2019, genre: "Thriller" },
];

function validateMovie(body, isStrict = true) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  //------------TITLE---------
  if (isStrict && body.title === undefined) {
    errors.push("title is required");
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    errors.push("title must be a non-empty string");
  }

  //----------YEAR--------
  //strict mode : year must be present
  if (isStrict && body.year === undefined) {
    errors.push("year is required");
  }
  //Value check: year must be whole num,
  //between 1888 and now+5year
  if (
    body.year !== undefined &&
    (!Number.isInteger(body.year) ||
      body.year < 1888 ||
      body.year > maximumYear)
  ) {
    errors.push("year must be a valid integer");
  }

  //------------GENRE--------
  if (isStrict && body.genre === undefined) {
    errors.push("genre is required");
  }
  // value check : genre should be non-empty string
  if (
    body.genre !== undefined &&
    (typeof body.genre !== "string" || body.genre.trim().length === 0)
  ) {
    errors.push("genre must be a non-empty string");
  }

  return errors;
}

app.get("/movies", (req, res) => {
  //get genre or minYear from query
  const { genre, minYear, sort } = req.query;
  //copy movies
  let filteredMovies = [...movies];
  // if genre was sent
  if (genre !== undefined) {
    //return all matching genre item , case-insensitive
    filteredMovies = filteredMovies.filter(
      (movie) => movie.genre.toLowerCase() === genre.toLowerCase(),
    );
  }

  //if minYear was sent
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

    filteredMovies = filteredMovies.filter(
      (movie) => movie.year >= minYearNumber,
    );
  }

  // add sort
  if (sort === "year") {
    filteredMovies.sort((a, b) => a.year - b.year);
  } else if (sort === "title") {
    filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort) {
    return res.status(400).json({
      error: {
        code: "INVALID_QUERY_PARAMETER",
        message: "sort must be year or title ",
      },
    });
  }
  res.status(200).json(filteredMovies);
});

// Get movies by id 1 movies
app.get("/movies/:id", (req, res) => {
  //take the id from req then convert to Number
  const id = Number(req.params.id);
  // compare and find the id from req with data
  const result = movies.find((movies) => movies.id === id);
  if (!result) {
    res.status(404).json({
      error: {
        code: "MOVIE_NOT_FOUND",
        message: "Movie not found",
      },
    });
    return;
  }
  res.status(200).json(result);
});

//PUT : Implement a complete replacement of an existing movie:
app.put("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = movies.findIndex((movie) => movie.id === id);
  // 404 : doesnot exist
  if (index === -1) {
    res.status(404).json({
      error: {
        code: "MOVIE_NOT_FOUND",
        message: "Movie not found",
      },
    });
    return;
  }

  //400
  const errors = validateMovie(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Movie data is invalid",
        details: errors,
      },
    });
  }

  //200 : ok
  movies[index] = { id, title, year, genre };
  res.status(200).json(movies[index]);
});

// POST /movies: create a new movie
app.post("/movies", (req, res) => {
  // 400: validate all fields (strict mode)
  const errors = validateMovie(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Movie data is invalid",
        details: errors,
      },
    });
  }

  // unique id: biggest existing id + 1 (1 if the array is empty)
  const id =
    movies.length > 0 ? Math.max(...movies.map((movie) => movie.id)) + 1 : 1;

  // take the three fields from the request body
  const { title, year, genre } = req.body;
  const newMovie = { id, title, year, genre };
  movies.push(newMovie);

  // 201: created
  res.status(201).json(newMovie);
});

//PATCH :Implement a partial update:
app.patch("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const movie = movies.find((movie) => movie.id === id);
  // 404 : doesnot exist
  if (!movie) {
    res.status(404).json({
      error: {
        code: "MOVIE_NOT_FOUND",
        message: "Movie not found",
      },
    });
    return;
  }

  //400 validate fields that were sent
  const errors = validateMovie(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Movie data is invalid",
        details: errors,
      },
    });
  }

  //update only provided fields
  const { title, year, genre } = req.body;
  if (title !== undefined) movie.title = title;
  if (year !== undefined) movie.year = year;
  if (genre !== undefined) movie.genre = genre;

  res.status(200).json(movie);
});

//Delete
app.delete("/movies/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = movies.findIndex((movie) => movie.id === id);
  if (index === -1) {
    res.status(404).json({
      error: {
        code: "MOVIE_NOT_FOUND",
        message: "Movie not found",
      },
    });
    return;
  }

  movies.splice(index, 1);
  res.status(200).send();
});

//start the server once only , bottom
app.listen(3000, () => {
  console.log("Server is runningg");
});
