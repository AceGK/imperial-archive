// list-books.mjs
import fs from "fs";

// Read and parse your nameless array JSON file
const data = JSON.parse(fs.readFileSync("./40k.json", "utf-8"));

// Loop through each book and print title + author(s)
data.forEach((book, index) => {
  const authors = Array.isArray(book.author)
    ? book.author.join(", ")
    : book.author || "Unknown author";
  console.log(`${index + 1}. ${book.title} — ${authors}`);
});
