import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";

export const getMovieReadableStream = async (movie) => {
  const posterToBase64 = await imageToBase64(movie.Poster);

  const fonts = {
    Courier: {
      normal: "Courier",
      bold: "Courier-Bold",
      italics: "Courier-Oblique",
      bolditalics: "Courier-BoldOblique",
    },
  };
  const docDefinition = {
    content: [
      {
        image: `data:image/jpeg; base64, ${posterToBase64}`,
        width: 150,
      },
      {
        text: [movie.Title],
        bold: true,
        fontSize: 25,
      },
      {
        text: [movie.Year],
        bold: false,
        fontSize: 17,
      },
    ],
    defaultStyle: {
      alignment: "center",
    },
  };

  const printer = new PdfPrinter(fonts);
  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();
  return pdfReadableStream;
};
