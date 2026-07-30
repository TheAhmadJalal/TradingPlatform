// frontend-server.js
// Static server for the Platform frontend.
//
//   node frontend-server.js      ->  http://localhost:5500

const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(__dirname, { extensions: ["html"] }));

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Frontend running on http://localhost:${PORT}`);
});
