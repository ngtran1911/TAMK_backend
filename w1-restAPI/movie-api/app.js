// 1. setup
require("dotenv").config(); // must be first: db.js reads process.env

const express = require("express");
const morgan = require("morgan");
const pool = require("./db");
const movieRoutes = require("./routes/movies");

const app = express();
app.use(express.json());
app.use(morgan("dev"));

// ---------- routes ----------

// Health check: proves Express can run SQL
app.get("/health/database", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");
    res.json({
      status: "ok",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    next(error);
  }
});

// register router onceimport movieRouter from "./routes/movies.js";

app.use("/movies", movieRoutes);

// unknown route → 404
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route does not exist",
    },
  });
});

// 5.7 database and other errors arrive here through next(error)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred",
    },
  });
});

// start the server (port from .env)
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
