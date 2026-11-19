require("dotenv").config();

const express = require('express')
const app = express()
const port = process.env.APP_PORT;
const prefix = process.env.APP_PREFIX;
const mainRouter = require('./src/routes/index');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(prefix, mainRouter.authRouter);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))