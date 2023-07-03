const hostname = 'localhost';
require('dotenv').config()

const port = process.env.SERVER_PORT;
const express = require('express');
var app = express();

//////////////TODO: not working with hotmal
app.use(express.json());

require("./calling-hello.js")(app);

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
