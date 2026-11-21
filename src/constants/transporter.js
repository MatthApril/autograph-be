const nodemailer = require("nodemailer");

function buildTransportOptions() {
	const method = process.env.MAIL_AUTH_METHOD;
	switch (method) {
		case "oauth2":
			return {
				service: process.env.MAIL_USER_SERVICE,
				name: process.env.MAIL_SERVER_NAME,
				auth: {
					type: "OAuth2",
					user: process.env.MAIL_OAUTH_USER,
					clientId: process.env.MAIL_OAUTH_CLIENT_ID,
					clientSecret: process.env.MAIL_OAUTH_CLIENT_SECRET,
					refreshToken: process.env.MAIL_OAUTH_REFRESH_TOKEN,
				},
			};
		case "password":
			return {
				service: process.env.MAIL_USER_SERVICE,
				name: process.env.MAIL_SERVER_NAME,
				auth: {
					user: process.env.MAIL_USER_USER,
					pass: process.env.MAIL_USER_PASS,
				},
			};
	}
}

const transporter = nodemailer.createTransport(buildTransportOptions());

module.exports = {
	transporter,
};
