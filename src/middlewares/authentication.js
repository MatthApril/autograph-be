const jwt = require("jsonwebtoken");

const authentication = async (req, res, next) => {
	try {
		// Node lowercases header names, so read the standard "Authorization: Bearer <token>"
		const header = req.headers.authorization ?? "";
		const access_token = header.startsWith("Bearer ") ? header.slice(7) : null;

		if (!access_token) {
			return res.status(401).json({
				status: 401,
				message: "Unauthorized",
			});
		}

		const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET);

		req.user = decoded;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				status: 401,
				message: "Unauthorized",
			});
		}

		return res.status(401).json({
			status: 401,
			message: "Unauthorized",
		});
	}
};

module.exports = authentication;
