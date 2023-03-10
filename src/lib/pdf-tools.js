import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";
import { getMoviesPDFWriteStream } from "./fs-tools.js";
import { promisify } from "util";
import { pipeline } from "stream";

export const getMovieReadableStream = async (movie) => {
  console.log(movie);
  const posterToBase64 = await imageToBase64(movie.Poster);

  const fonts = {
    Courier: {
      normal: "Courier",
      bold: "Courier-Bold",
      italics: "Courier-Oblique",
      bolditalics: "Courier-BoldOblique",
    },
    Roboto: {
      normal: "./src/fonts/Roboto-Regular.ttf",
      bold: "./src/fontsRoboto-Bold.ttf",
      italics: "./src/fontsRoboto-Italic.ttf",
      bolditalics: "./src/fontsRoboto-BoldItalic.ttf",
    },
  };
  const docDefinition = {
    content: [
      {
        image: `data:image/jpeg;base64,${posterToBase64}`,
        width: 150,
      },
      {
        text: [movie.Title],
        fontSize: 25,
      },
      {
        text: [movie.Year],
        fontSize: 17,
      },
    ],
    defaultStyle: {
      fontFamily: "Courier",
      alignment: "center",
    },
  };

  const printer = new PdfPrinter(fonts);
  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();
  return pdfReadableStream;
};

export const asyncMoviesPDFGenerator = async (file) => {
  const source = await getMovieReadableStream(file);
  const destination = getMoviesPDFWriteStream(`${file.imdbID}.pdf`);
  const promisePipeline = promisify(pipeline);
  await promisePipeline(source, destination);
};
