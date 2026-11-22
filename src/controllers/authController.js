const { OAuth2Client } = require("google-auth-library");
const prisma = require("../config/prisma");
const {
	generateAccessToken,
	generateRefreshToken,
} = require("../helpers/jwtKeyGenerator");
const googleClient = new OAuth2Client();
const bcrypt = require("bcrypt");
const generateOTP = require("../helpers/generateOTP");
const { transporter } = require("../constants/transporter");
const mailOptions = require("../constants/mailOptions");
const renderOTPTemplate = require("../helpers/renderOTPTemplate");
const { redisClient } = require("../config/redisClient");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user_login = await prisma.users.findUnique({
			where: { email },
			omit: {
				googleSub: true,
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
			},
		});

		if (!user_login) {
			return res.status(400).json({
				status: 400,
				message: "Invalid username or password!",
			});
		}

		const is_valid_pass = await bcrypt.compare(password, user_login.password);
		if (!is_valid_pass) {
			return res.status(400).json({
				status: 400,
				message: "Invalid username or password!",
			});
		}

		user_login.password = undefined;
		const access_token = generateAccessToken(user_login);
		const refresh_token = generateRefreshToken(user_login);

		user_login.access_token = access_token;
		user_login.refresh_token = refresh_token;

		return res.status(200).json(user_login);
	} catch (error) {
		console.error("Error fetching users:", error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

const register = async (req, res) => {
	try {
		const { name, email, password, confirm_password } = req.body;
		if (password !== confirm_password) {
			return res.status(400).json({
				status: 400,
				message: "Passwords do not match!",
			});
		}

		const existingUser = await prisma.users.findUnique({
			where: { email: email },
		});

		if (existingUser) {
			return res.status(409).json({
				status: 409,
				message: "Email already registered!",
			});
		}

		const redisKey = `register:${email}`;
		const exists = await redisClient.exists(redisKey);

		if (exists) {
			return res.status(409).json({
				status: 409,
				message: "Please verify your email before registering again!",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const otp = generateOTP();

		const pendingUser = {
			name: name.trim(),
			email: email,
			password: hashedPassword,
			otp,
		};

		await redisClient.set(redisKey, JSON.stringify(pendingUser), {
			EX: 60,
			NX: true,
		});

		await transporter.sendMail(
			mailOptions(
				email,
				"Autograph - Verify Your Email",
				renderOTPTemplate(otp),
			),
		);

		return res.status(200).json({
			status: 200,
			message: "Verification code sent successfully.",
			data: null,
		});
	} catch (error) {
		console.error("Error registering user:", error);

		return res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

const verifyEmail = async (req, res) => {
	try {
		const { email, otp } = req.body;
		const redisKey = `register:${email}`;
		const pendingUserData = await redisClient.get(redisKey);

		if (!pendingUserData) {
			return res.status(400).json({
				status: 400,
				message: "No pending registration found for this email.",
			});
		}

		const pendingUser = JSON.parse(pendingUserData);

		if (pendingUser.otp !== otp) {
			return res.status(400).json({
				status: 400,
				message: "Invalid verification code.",
			});
		}

		await prisma.users.create({
			data: {
				name: pendingUser.name,
				email: pendingUser.email,
				password: pendingUser.password,
			},
		});

		await redisClient.del(redisKey);

		return res.status(200).json({
			status: 200,
			message: "Email verified successfully.",
			data: null,
		});
	} catch (error) {
		console.error("Error verifying email:", error);

		return res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

const refreshOTP = async (req, res) => {
	try {
		const { email } = req.body;
		const redisKey = `register:${email}`;
		const pendingUserData = await redisClient.get(redisKey);

		if (!pendingUserData) {
			return res.status(400).json({
				status: 400,
				message: "No pending registration found for this email.",
			});
		}

		const pendingUser = JSON.parse(pendingUserData);
		const newOtp = generateOTP();
		pendingUser.otp = newOtp;

		await redisClient.del(redisKey);

		await redisClient.set(redisKey, JSON.stringify(pendingUser), {
			EX: 60,
			NX: true,
		});

		await transporter.sendMail(
			mailOptions(
				email,
				"Autograph - Verify Your Email",
				renderOTPTemplate(newOtp),
			),
		);

		return res.status(200).json({
			status: 200,
			message: "New verification code sent successfully.",
			data: null,
		});
	} catch (error) {
		console.error("Error refreshing OTP:", error);

		return res.status(500).json({
			status: 500,
			message: "Internal Server Error",
			data: null,
		});
	}
};

const signInWithGoogle = async (req, res) => {
	try {
		const { id_token } = req.body ?? {};

		if (typeof id_token !== "string" || !id_token.trim()) {
			return res.status(400).json({
				message: "Google ID Token is required",
				data: null,
			});
		}

		const ticket = await googleClient.verifyIdToken({
			idToken: id_token,
			audience: process.env.GOOGLE_WEB_CLIENT_ID,
		});

		const payload = ticket.getPayload();

		if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
			return res.status(401).json({
				message: "Invalid Google account information",
				data: null,
			});
		}

		const { sub, email, name, picture } = payload;
		let user = await prisma.users.findUnique({
			where: { googleSub: sub },
		});

		let isNewUser = false;

		if (!user) {
			const existingUser = await prisma.users.findUnique({
				where: { email },
			});

			if (existingUser) {
				return res.status(409).json({
					message: "Email already registered. Please link your Google account.",
					data: null,
				});
			}

			user = await prisma.users.create({
				data: {
					name: name?.trim() || email.split("@")[0],
					email,
					picture: picture ?? null,
					googleSub: sub,
				},
			});

			isNewUser = true;
		}

		return res.status(isNewUser ? 201 : 200).json({
			message:
				isNewUser ?
					"Google registration successful"
				:	"Google login successful",
			data: {
				id: user.user_id,
				name: user.name,
				email: user.email,
				picture: user.picture,
			},
		});
	} catch (error) {
		console.error("Google Auth Error:", error);

		return res.status(500).json({
			message: "Google authentication failed",
			data: null,
		});
	}
};

const refreshToken = async (req, res) => {
	try {
		const { refresh_token } = req.body;

		if (!refresh_token) {
			return res.status(400).json({
				status: 400,
				message: "Refresh token is required",
			});
		}

		const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

		const newAccessToken = generateAccessToken({
			user_id: decoded.user_id,
			name: decoded.name,
			email: decoded.email,
			picture: decoded.picture,
		});

		return res.status(200).json({
			status: 200,
			message: "Access token refreshed successfully",
			data: {
				access_token: newAccessToken,
			},
		});
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({
				status: 401,
				message: "Refresh token has expired",
			});
		}

		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({
				status: 401,
				message: "Invalid refresh token",
			});
		}

		console.error("Error refreshing token:", error);
		return res.status(500).json({
			status: 500,
			message: "Internal Server Error",
		});
	}
};

module.exports = {
	login,
	register,
	verifyEmail,
	refreshOTP,
	signInWithGoogle,
	refreshToken,
};
