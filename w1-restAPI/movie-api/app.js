// 1. setup
const express = require("express");
const app = express();
app.use(express.json());

// movie data store in memory
let movies = [
  { id: 1, title: "Inception", director: "Christopher Nolan", year: 2010 },
  { id: 2, title: "The Matrix", director: "The Wachowskis", year: 1999 },
  { id: 3, title: "Parasite", director: "Bong Joon-ho", year: 2019 },
];

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
