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

function validateMovie(body, partial = false) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  if (!partial && body.title === undefined) {
    errors.push("title is required");
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    errors.push("title must be a non-empty string");
  }

  if (!partial && body.year === undefined) {
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

  if (!partial && body.genre === undefined) {
    errors.push("genre is required");
  }

  if (
    body.genre !== undefined &&
    (typeof body.genre !== "string" || body.genre.trim().length === 0)
  ) {
    errors.push("genre must be a non-empty string");
  }

  return errors;
}

//with path /movies to get all movies data using GET
app.get("/movies", (req, res) => {
  res.status(200).json(movies);
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

//Implement a complete replacement of an existing movie: PUT
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

  //400 : data missing
  const { title, director, genre } = req.body;
  if (title === undefined || year === undefined || genre === undefined) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Movie data is invalid",
        details: ["title, year and genre are required"],
      },
    });
  }

  //200 : ok
  movies[index] = { id, title, year, genre };
  res.status(200).json(movies[index]);
});

//create a movies using POST
app.post("/movies", (req, res) => {
  //get data from input
  const { title, director, year } = req.body;
  //lack of 1 of those info throw error
  if (!title || !director || !year) {
    res.status(400).json({
      //400:BAD REQUEST
      error: {
        code: "TITLE_DIRECTOR_YEAR_ARE_REQUIRED",
        message: "title, director and year are required",
      },
    });
    return;
  } //true -> id +1, display new movies data
  const id = movies.length + 1;
  const newMovie = { id, title, director, year };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

//start the server once only , bottom
app.listen(3000, () => {
  console.log("Server is runningg");
});
