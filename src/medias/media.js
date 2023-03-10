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
          `http://www.omdbapi.com/?apikey=${process.env.omdbAPI}&s=${query.Title}&r=json&page=1`
        );
        const omdbData = await omdb.json();
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

mediaRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const index = movies.findIndex((movie) => movie.id === req.params.id);
    res.send(movies[index]);
  } catch (error) {
    next(error);
  }
});

mediaRouter.post("/:id/reviews", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const index = movies.findIndex((movie) => movie.id === req.params.id);
    const newReview = {
      _id: uniqid(),
      ...req.body,
      createdAt: new Date(),
    };
    console.log(movies[index]);
    movies[index].reviews.push(newReview);
    await writeMovies(movies);
    res.status(201).send(movies[index].reviews);
  } catch (error) {
    next(error);
  }
});

mediaRouter.put("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const movies = await getMovies();
    let reviewIndex = 0;
    const movieIndex = movies.findIndex((movie) => movie.id === req.params.id);
    if (!movieIndex == -1) {
      res.status(404).send({ message: `It's 404 you know what it means X)` });
    } else {
      reviewIndex = movies[movieIndex].reviews.findIndex(
        (review) => review._id === req.params.reviewId
      );
    }
    const preEdit = movies[movieIndex].reviews[reviewIndex];
    const afterEdit = {
      ...preEdit,
      ...req.body,
      updatedAt: new Date(),
    };
    movies[movieIndex].reviews[reviewIndex] = afterEdit;
    await writeMovies(movies);
    res.status(202).send(afterEdit);
  } catch (error) {
    next(error);
  }
});

mediaRouter.delete("/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const index = movies.findIndex((movie) => movie.imdID === req.params.id);
    const oldMovie = movies[index];
    const newReviews = oldMovie.reviews.filter(
      (review) => review._id !== req.params.reviewId
    );
    const newReview = { ...oldMovie, reviews: newReviews };
    movies[index] = newReview;
    await writeBlogPosts(movies);
    res.status(204).send();
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
        console.log(movies[index].Poster);
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
