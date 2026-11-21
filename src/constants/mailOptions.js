const mailOptions = (email, subject, html, attachment = null) => ({
	from: process.env.MAIL_USER_FROM,
	to: email,
	subject: subject,
	html: html,
	attachments: attachment ? [attachment] : [],
});

module.exports = mailOptions;
