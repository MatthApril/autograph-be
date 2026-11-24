// All verification timings in one place, so the app, the email and the server agree.
module.exports = {
	OTP_TTL_SECONDS: 60, // how long one code is valid
	PENDING_TTL_SECONDS: 15 * 60, // how long a sign-up waits for verification
	RESEND_COOLDOWN_SECONDS: 60, // minimum gap between two emails
	MAX_ATTEMPTS: 5, // wrong codes allowed before the sign-up is cancelled
};
