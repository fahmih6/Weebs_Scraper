const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

app.use(express.json());

app.use("/api/komikcast/", require("./routes/manga-route.js"));

app.use("/api/anoboy/", require("./routes/anime-route.js"));

app.listen(port, () => console.log(`server running on port ${port}`));
