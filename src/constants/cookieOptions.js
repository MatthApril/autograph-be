const accessCookieOptions = {
	httpOnly: true,
	secure: true,
	sameSite: "strict",
	path: "/",
	maxAge: 15 * 60 * 1000, // 15 menit
};

const refreshCookieOptions = {
	httpOnly: true,
	secure: true,
	sameSite: "strict",
	path: "/",
	maxAge: 14 * 24 * 60 * 60 * 1000, // 14 hari
};

module.exports = {
	accessCookieOptions,
	refreshCookieOptions,
};
