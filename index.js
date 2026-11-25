require("dotenv").config();

const express = require("express");
const { connectRedis } = require("./src/config/redisClient");
const mainRouter = require("./src/routes/index");

const app = express();

const port = process.env.APP_PORT || 3000;
const prefix = process.env.APP_PREFIX || "/api";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(prefix, mainRouter.authRouter);

app.get("/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		uptime: process.uptime(),
		timestamp: Date.now(),
	});
});

const startServer = async () => {
	try {
		await connectRedis();

		console.log("Redis connected successfully");
		app.listen(port, "0.0.0.0", () => {
			console.log(`Server running on port ${port}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
