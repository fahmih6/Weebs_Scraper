const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(morgan("dev"));

app.use(express.json());

/// Use Komikcast route
app.use("/api/komikcast/", require("./routes/manga-route.js"));

/// Use Komiku route
app.use("/api/komiku/", require("./routes/komiku-route.js"));

/// Use Anoboy route
app.use("/api/anoboy/", require("./routes/anoboy-route.js"));

/// Use Anoboy V2 route
app.use("/api/v2/anoboy/", require("./routes/anoboy-route-v2.js"));

/// Use Dorama route
app.use("/api/dorama/", require("./routes/dorama-route.js"));

/// Listen to certain port
app.listen(port, () => console.log(`server running on port ${port}`));
