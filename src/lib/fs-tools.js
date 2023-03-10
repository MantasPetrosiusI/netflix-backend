import fs from "fs-extra";
import { fileURLToPath } from "url";
import multer from "multer";
import { dirname, join } from "path";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const { readJSON, writeJSON, createReadStream, createWriteStream } = fs;

export const moviesJSONPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../JSONdata/medias.json"
);
export const moviesPDFPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../JSONdata"
);

export const getMovies = () => readJSON(moviesJSONPath);
export const writeMovies = (movieArray) =>
  writeJSON(moviesJSONPath, movieArray);

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
  createWriteStream(join(moviesPDFPath, filename));
