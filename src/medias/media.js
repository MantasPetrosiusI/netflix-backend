import express from "express";
import createError from "http-errors";
import uniqid from "uniqid";
import { pipeline } from "stream";
import { validation } from "./validation.js";
import {
  getMovies,
  writeMovies,
  savePosterCloudinary,
  moviesJSONPath,
} from "../lib/fs-tools.js";
import { getMovieReadableStream } from "../lib/pdf-tools.js";

const mediaRouter = express.Router();

mediaRouter.post("/", async (req, res, next) => {
  try {
    const { error } = validation.validate(req.body);
    if (error) {
      return res.status(400).send("Wrong inputs!");
    }

    const movies = await getMovies();
    const newMedia = {
      Title: req.body.Title,
      imdID: uniqid(),
      Year: req.body.Year,
      Type: req.body.Type,
      Poster: req.body.Poster || "",
    };

    movies.push(newMedia);
    writeMovies(movies);
    res.send(201);
  } catch (error) {
    next(error);
  }
});

// mediaRouter.get("/", async (req, res, next) => {
//   try {
//     const movies = await getMovies();
//     res.send(movies);
//   } catch (error) {
//     next(error);
//   }
// });

mediaRouter.get("/:id", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const movie = movies.find(
      (singleMovie) => singleMovie.imdID === req.params.id
    );
    if (!movie) {
      res.status(404).send({
        message: `It's 404 for movie with id: ${id}, means it doesn't exist!`,
      });
    }
    res.send(movie);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const query = req.query;

    if (query && query.Title) {
      const filteredMedia = movies.filter((media) =>
        media.Title.toLocaleLowerCase().includes(
          query.Title.toLocaleLowerCase()
        )
      );
      if (filteredMedia.length > 0) {
        res.send({ media: filteredMedia });
      } else {
        const omdb = await fetch(
          `http://www.omdbapi.com/?i=tt3896198&apikey=${process.env.omdbAPI}&s=${query}&r=json&page=1`
        );

        const omdbData = await omdb.json();
        console.log(omdbData);
        if (omdbData.Response === "True") {
          const omdbSearch = omdbData.Search;

          movies.push(...omdbSearch);
          await writeMovies(movies);
          res.send({ movies: omdbSearch });
        } else {
          next(
            createError(404, {
              message: `Its 404 when you write after fetching omdb`,
            })
          );
        }
      }
    } else {
      res.send({ movies });
    }
  } catch (error) {
    next(error);
  }
});

mediaRouter.post(
  "/:id/poster",
  savePosterCloudinary,
  async (req, res, next) => {
    try {
      const movies = await getMovies();
      const index = movies.findIndex((movie) => movie.imdID === req.params.id);
      if (index !== -1) {
        movies[index].Poster = req.file.path;
        await writeMovies(movies);
        res.status(201).send({ message: `Uploaded :)` });
      }
    } catch (error) {
      next(error);
    }
  }
);

mediaRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const movieToPDF = movies.find((movie) => movie.imdID === req.params.id);
    if (movieToPDF) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${movieToPDF.Title}.pdf`
      );
      const source = await getMovieReadableStream(movieToPDF);
      const destination = res;
      pipeline(source, destination, (err) => {
        if (err) {
          console.log(err);
        }
        res.send(`ok`);
      });
    } else {
      createError(404, `It's 404 regarding pdf, you know what that means.`);
    }
  } catch (error) {
    next(error);
  }
});
export default mediaRouter;
