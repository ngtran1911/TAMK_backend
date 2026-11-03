const { title } = require("node:process");
const express = require("express");

const app = express();
const PORT = 3001;

app.use(express.json());

let movies = [
  {
    id: 1,
    title: "parasite",
    year: 1999,
  },
];

// create new movies
app.post("/movies", (req, res) => {
  const { title, director, year } = req.body;
  if (!title || !director || !year) {
    return res.status(404).json("invalid");
  } else {
    return res.status(200);
  }
});
