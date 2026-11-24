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
const jwt = require("jsonwebtoken")
const { sendSuccess, sendError } = require("../helpers/apiResponse");
const {
	OTP_TTL_SECONDS,
	PENDING_TTL_SECONDS,
	RESEND_COOLDOWN_SECONDS,
	MAX_ATTEMPTS,
} = require("../constants/otp");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Maya@Example.com " and "maya@example.com" must be the same account
const normalizeEmail = (email) =>
	typeof email === "string" ? email.trim().toLowerCase() : "";

const pendingKey = (email) => `register:${email}`;
const nowSeconds = () => Math.floor(Date.now() / 1000);

const savePending = (email, pending) =>
	redisClient.set(pendingKey(email), JSON.stringify(pending), {
		EX: PENDING_TTL_SECONDS,
	});

const sendOtpEmail = (email, otp) =>
	transporter.sendMail(
		mailOptions(email, "Autograph - Verify Your Email", renderOTPTemplate(otp)),
	);

// Tells the app how long to count down, so its timer matches the server
const otpTiming = (email) => ({
	email,
	otp_expires_in: OTP_TTL_SECONDS,
	resend_available_in: RESEND_COOLDOWN_SECONDS,
});

const publicUser = (user) => ({
	user_id: user.user_id,
	name: user.name,
	email: user.email,
	picture: user.picture ?? null,
});

const issueSession = (user) => ({
	user: publicUser(user),
	access_token: generateAccessToken(user),
	refresh_token: generateRefreshToken(user),
});

const login = async (req, res) => {
	const email = normalizeEmail(req.body?.email);
	const password =
		typeof req.body?.password === "string" ? req.body.password : "";

	try {
		const user = await prisma.users.findUnique({ where: { email } });

		// Google-only accounts have no password; bcrypt.compare would crash on null
		const valid = user?.password
			? await bcrypt.compare(password, user.password)
			: false;
		if (!valid) {
			return sendError(
				res,
				401,
				"INVALID_CREDENTIALS",
				"Incorrect email or password.",
			);
		}

		return sendSuccess(res, 200, "Login successful.", issueSession(user));
	} catch (error) {
		console.error("Error logging in:", error);
		return sendError(res, 500, "INTERNAL", "Internal Server Error");
	}
};

const register = async (req, res) => {
	const email = normalizeEmail(req.body?.email);
	const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
	const { password, confirm_password } = req.body ?? {};

	try {
		// Never trust the app alone: check input on the server too
		if (
			!name ||
			!EMAIL_PATTERN.test(email) ||
			typeof password !== "string" ||
			password.length < 8
		) {
			return sendError(
				res,
				400,
				"VALIDATION_ERROR",
				"Please enter a name, a valid email and a password of at least 8 characters.",
			);
		}
		if (password !== confirm_password) {
			return sendError(
				res,
				400,
				"PASSWORD_MISMATCH",
				"Passwords do not match!",
			);
		}

		const existingUser = await prisma.users.findUnique({ where: { email } });
		if (existingUser) {
			return sendError(res, 409, "EMAIL_TAKEN", "Email already registered!");
		}

		const otp = generateOTP();
		const pending = {
			name,
			email,
			password: await bcrypt.hash(password, 10),
			otp,
			otpExpiresAt: nowSeconds() + OTP_TTL_SECONDS,
			lastSentAt: nowSeconds(),
			attempts: 0,
		};

		// NX = "only if it doesn't exist yet". Check and save in ONE step, so two
		// fast taps on "Create account" can't both succeed.
		const saved = await redisClient.set(
			pendingKey(email),
			JSON.stringify(pending),
			{
				EX: PENDING_TTL_SECONDS,
				NX: true,
			},
		);
		if (!saved) {
			return sendError(
				res,
				409,
				"VERIFICATION_PENDING",
				"Please verify your email before registering again!",
			);
		}

		try {
			await sendOtpEmail(email, otp);
		} catch (mailError) {
			// No email went out, so don't leave a pending sign-up nobody can verify
			await redisClient.del(pendingKey(email));
			throw mailError;
		}

		return sendSuccess(
			res,
			200,
			"Verification code sent successfully.",
			otpTiming(email),
		);
	} catch (error) {
		console.error("Error registering user:", error);
		return sendError(res, 500, "INTERNAL", "Internal Server Error");
	}
};

const verifyEmail = async (req, res) => {
	const email = normalizeEmail(req.body?.email);
	const otp = String(req.body?.otp ?? "").trim(); // always compare strings

	try {
		const raw = await redisClient.get(pendingKey(email));
		if (!raw) {
			return sendError(
				res,
				404,
				"NO_PENDING_SIGNUP",
				"Your sign-up timed out. Please create your account again.",
			);
		}

		const pending = JSON.parse(raw);

		if (nowSeconds() > pending.otpExpiresAt) {
			return sendError(res, 410, "OTP_EXPIRED", "This code has expired.");
		}

		if (pending.otp !== otp) {
			pending.attempts += 1;

			if (pending.attempts >= MAX_ATTEMPTS) {
				await redisClient.del(pendingKey(email));
				return sendError(
					res,
					429,
					"TOO_MANY_ATTEMPTS",
					"Too many wrong codes. Please create your account again.",
				);
			}

			// Save the new attempt count without resetting the sign-up's lifetime
			const ttl = await redisClient.ttl(pendingKey(email));
			await redisClient.set(pendingKey(email), JSON.stringify(pending), {
				EX: Math.max(ttl, 1),
			});

			return sendError(
				res,
				400,
				"OTP_INVALID",
				"That code isn't right. Try again.",
				{
					attempts_left: MAX_ATTEMPTS - pending.attempts,
				},
			);
		}

		const user = await prisma.users.create({
			data: {
				name: pending.name,
				email: pending.email,
				password: pending.password,
			},
		});
		await redisClient.del(pendingKey(email));

		// Log the new user in straight away: same shape as /login
		return sendSuccess(
			res,
			201,
			"Email verified successfully.",
			issueSession(user),
		);
	} catch (error) {
		if (error.code === "P2002") {
			// Prisma's "unique constraint" error: two verify requests raced each other
			return sendError(res, 409, "EMAIL_TAKEN", "Email already registered!");
		}
		console.error("Error verifying email:", error);
		return sendError(res, 500, "INTERNAL", "Internal Server Error");
	}
};

const refreshOTP = async (req, res) => {
	const email = normalizeEmail(req.body?.email);

	try {
		const raw = await redisClient.get(pendingKey(email));
		if (!raw) {
			return sendError(
				res,
				404,
				"NO_PENDING_SIGNUP",
				"Your sign-up timed out. Please create your account again.",
			);
		}

		const pending = JSON.parse(raw);
		const waitSeconds =
			pending.lastSentAt + RESEND_COOLDOWN_SECONDS - nowSeconds();
		if (waitSeconds > 0) {
			return sendError(
				res,
				429,
				"RESEND_TOO_SOON",
				`Please wait ${waitSeconds}s before requesting a new code.`,
				{ resend_available_in: waitSeconds },
			);
		}

		const otp = generateOTP();
		// Send first: if the email fails, the old record (and code) stays as it was
		await sendOtpEmail(email, otp);
		await savePending(email, {
			...pending,
			otp,
			otpExpiresAt: nowSeconds() + OTP_TTL_SECONDS,
			lastSentAt: nowSeconds(),
			attempts: 0,
		});

		return sendSuccess(
			res,
			200,
			"New verification code sent successfully.",
			otpTiming(email),
		);
	} catch (error) {
		console.error("Error refreshing OTP:", error);
		return sendError(res, 500, "INTERNAL", "Internal Server Error");
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
