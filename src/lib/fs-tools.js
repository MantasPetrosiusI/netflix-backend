import fs from "fs-extra";
import { fileURLToPath } from "url";
import multer from "multer";
import { dirname, join } from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const { readJSON, writeJSON, createReadStream, createWriteStream } = fs;

export const dataPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../JSONdata"
);
export const moviesJSONPath = join(dataPath, "/medias.json");
export const reviewsJSONPath = join(dataPath, "/reviews.json");

export const getMovies = () => readJSON(moviesJSONPath);
export const writeMovies = (movieArray) =>
  writeJSON(moviesJSONPath, movieArray);

export const getReviews = () => readJSON(reviewsJSONPath);
export const writeReviews = (reviewsArray) =>
  writeJSON(reviewsJSONPath, reviewsArray);

export const savePosterCloudinary = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "backend-w2-solo/posters",
    },
  }),
}).single("poster");

export const getMoviesPDFReadableStream = () =>
  createReadStream(moviesJSONPath);

export const getMoviesPDFWriteStream = (filename) =>
  createWriteStream(join(dataPath, filename));
