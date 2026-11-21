const renderOTPTemplate = (otp) => {
	const code = String(otp);

	if (!/^\d{6}$/.test(code)) {
		throw new Error("OTP must be a 6-digit code");
	}

	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>Verify your email · Autograph</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #FAF8F5;
    font-family: Arial, Helvetica, sans-serif;
    color: #171717;
">

    <!-- Main Background -->
    <table
        role="presentation"
        cellpadding="0"
        cellspacing="0"
        border="0"
        width="100%"
        style="background-color: #FAF8F5;"
    >
        <tr>
            <td align="center" style="padding: 56px 20px;">

                <!-- Email Container -->
                <table
                    role="presentation"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    width="100%"
                    style="max-width: 520px;"
                >

                    <!-- Logo -->
                    <tr>
                        <td align="center" style="padding-bottom: 38px;">
                            <table role="presentation" cellpadding="0"
                                cellspacing="0" border="0">
                                <tr>
                                    <td style="padding-right: 12px;">
                                        <!-- Autograph Symbol -->
                                        <svg
                                            width="38"
                                            height="30"
                                            viewBox="0 0 38 30"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M3 22C6 22 7 8 10 8C13 8 10 23 15 23C19 23 19 13 22 13C25 13 22 23 27 23C30 23 32 19 35 19"
                                                stroke="#4F5FE8"
                                                stroke-width="3"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    </td>
                                    <td style="
                                        font-size: 25px;
                                        font-weight: 700;
                                        letter-spacing: -1px;
                                        color: #171717;
                                    ">
                                        Autograph
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td style="
                            background-color: #FFFFFF;
                            border: 1px solid #EAE7E2;
                            border-radius: 24px;
                            padding: 48px 38px;
                        ">

                            <!-- Decorative Icon -->
                            <table role="presentation"
                                cellpadding="0" cellspacing="0"
                                border="0" align="center">
                                <tr>
                                    <td align="center" style="
                                        width: 68px;
                                        height: 68px;
                                        background-color: #F0F1FF;
                                        border-radius: 20px;
                                        font-size: 30px;
                                        color: #4F5FE8;
                                    ">
                                        &#9993;
                                    </td>
                                </tr>
                            </table>

                            <!-- Heading -->
                            <h1 style="
                                font-family: Georgia, 'Times New Roman', serif;
                                font-size: 34px;
                                font-weight: 400;
                                line-height: 1.2;
                                letter-spacing: -1px;
                                text-align: center;
                                margin: 32px 0 14px;
                                color: #171717;
                            ">
                                A little step to<br />
                                make it yours.
                            </h1>

                            <!-- Description -->
                            <p style="
                                font-size: 15px;
                                line-height: 1.8;
                                text-align: center;
                                color: #777777;
                                margin: 0 0 32px;
                            ">
                                Welcome to Autograph. Your quiet space
                                for thoughts, sketches, and ideas is
                                almost ready.
                                <br /><br />
                                Use this code to verify your email address.
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation"
                                cellpadding="0" cellspacing="0"
                                border="0" width="100%">
                                <tr>
                                    <td align="center" style="
                                        background-color: #F7F7FF;
                                        border: 1px solid #E6E8FF;
                                        border-radius: 16px;
                                        padding: 26px 12px;
                                    ">

                                        <p style="
                                            font-size: 11px;
                                            font-weight: 700;
                                            letter-spacing: 2px;
                                            text-transform: uppercase;
                                            color: #8585A0;
                                            margin: 0 0 12px;
                                        ">
                                            YOUR VERIFICATION CODE
                                        </p>

                                        <span style="
                                            font-family: Arial, Helvetica, sans-serif;
                                            font-size: 38px;
                                            font-weight: 700;
                                            letter-spacing: 7px;
                                            color: #4F5FE8;
                                        ">
                                            ${code}
                                        </span>

                                    </td>
                                </tr>
                            </table>

                            <!-- Expiration -->
                            <p style="
                                font-size: 13px;
                                text-align: center;
                                color: #888888;
                                margin: 22px 0 0;
                                line-height: 1.7;
                            ">
                                This code expires in
                                <strong style="color: #292929;">
                                    1 minute
                                </strong>.
                                <br />
                                Please don't share it with anyone.
                            </p>

                            <!-- Divider -->
                            <table role="presentation" width="100%"
                                cellpadding="0" cellspacing="0"
                                border="0" style="margin: 35px 0 25px;">
                                <tr>
                                    <td style="
                                        border-top: 1px solid #EAE7E2;
                                    "></td>
                                </tr>
                            </table>

                            <!-- Bottom Message -->
                            <p style="
                                font-family: Georgia, 'Times New Roman', serif;
                                font-size: 19px;
                                font-style: italic;
                                color: #777777;
                                text-align: center;
                                line-height: 1.5;
                                margin: 0;
                            ">
                                Your ideas deserve a<br />
                                place to grow.
                            </p>

                            <!-- Yellow Accent -->
                            <table role="presentation"
                                cellpadding="0" cellspacing="0"
                                border="0" align="center"
                                style="margin-top: 22px;">
                                <tr>
                                    <td style="
                                        width: 26px;
                                        height: 4px;
                                        border-radius: 4px;
                                        background-color: #F5B642;
                                    "></td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding-top: 34px;">

                            <p style="
                                font-size: 13px;
                                color: #9A9691;
                                line-height: 1.8;
                                margin: 0 0 14px;
                            ">
                                Didn't request this code?
                                <br />
                                You can safely ignore this email.
                            </p>

                            <p style="
                                font-size: 12px;
                                color: #B3AEA8;
                                margin: 0;
                            ">
                                © ${new Date().getFullYear()} Autograph
                                <br />
                                Make space for what matters.
                            </p>

                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>
    `;
};

module.exports = renderOTPTemplate;
