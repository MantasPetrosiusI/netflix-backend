import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import mediaRouter from "./src/medias/media.js";
import {
  badRequestHandler,
  unauthorizedHandler,
  notfoundHandler,
  genericErrorHandler,
} from "./errorHandlers.js";
import createError from "http-errors";

const server = express();
const port = process.env.PORT;

const whitelist = [process.env.FE_DEV_URL, process.env.FE_PROD_URL];

server.use(
  cors({
    origin: (currentOrigin, corsNext) => {
      if (!currentOrigin || whitelist.indexOf(currentOrigin) !== -1) {
        corsNext(null, true);
      } else {
        corsNext(
          createError(400, `Origin ${currentOrigin} is not in the whitelist!`)
        );
      }
    },
  })
);
server.use(express.json());

server.use("/medias", mediaRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notfoundHandler);
server.use(genericErrorHandler);

console.table(listEndpoints(server));

server.listen(port, () => {
  console.log("Server runs on this port = ", port);
});
