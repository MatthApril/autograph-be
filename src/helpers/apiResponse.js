// Every response gets the same shape, and every error gets a code the app can branch on.
// Messages are for humans and may change; codes are for programs and shouldn't.
const sendSuccess = (res, status, message, data = null) =>
	res.status(status).json({ status, message, data });

const sendError = (res, status, code, message, data = null) =>
	res.status(status).json({ status, code, message, data });

module.exports = { sendSuccess, sendError };
