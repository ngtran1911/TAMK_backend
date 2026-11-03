const express = require("express");
const app = express();
app.use(express.json());

let movies = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan ",
    year: 2010,
  },
  {
    id: 2,
    title: "The Matrix",
    director: "The Wachowskis",
    year: 1999,
  },
  {
    id: 3,
    title: "Parasite",
    director: "Bong Joon-ho",
    year: 2019,
  },
];

//implement get request
// express rote
app.get("/movies", (req, res) => {
  //http response : set status and send data as JSON
  res.status(200);
  res.json(movies);
});

// get movie by id
app.get("/movies", (req, res) => {
  const id = Number(req.params.id);
  const result = movies.find((movie) => movie.id === id);
  if (!result) {
    res.status(404).json("movie not found");
  } else {
    res.status(200).json(result);
  }
});

// create new movie POST
app.post("/movies", (req, res) => {
  const { title, director, year } = req.body;
  if (!title || !director || !year) {
    return res.status(400).json({
      error: "title, director and year are required",
    });
  } else {
    const id = movies.length + 1;
    const newMovie = { id, title, director, year };
    movies.push(newMovie);
    return res.status(201).json(newMovie); //201 : created
  }
});

app.listen(3000, () => {
  console.log("server running on http://localhost:3000");
});
