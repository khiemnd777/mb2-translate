const express = require('express');
const app = express();
const initRoutes = require('./routes');

app.use(express.urlencoded({ extended: true }));
initRoutes(app);

const port = 7000;
app.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});
