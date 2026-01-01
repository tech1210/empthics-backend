export const passwordResetTemplate = (otp) => `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:24px; border-radius:6px;">
      <h2 style="color:#00325f; text-align:center;">Reset Password OTP</h2>
      <p>Dear User,</p>
      <p>We received a request to reset your password. Please use the OTP below:</p>
      <div style="text-align:center; margin:20px 0;">
        <span style="display:inline-block; background-color:#ffd700; color:#00325f; padding:12px 28px; border-radius:6px; font-size:20px; font-weight:bold;">
          ${otp}
        </span>
      </div>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  </body>
</html>
`;

export const otpVerificationTemplate = (otp) => `
<html>
  <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#fff; padding:24px; border-radius:6px;">
      <h2 style="color:#00325f; text-align:center;">Your Verification OTP</h2>
      <p>Hello,</p>
      <p>Use the OTP below to complete your verification. It is valid for 10 minutes:</p>
      <div style="text-align:center; margin:20px 0;">
        <span style="display:inline-block; background-color:#ffd700; color:#00325f; padding:12px 28px; border-radius:6px; font-size:20px; font-weight:bold;">
          ${otp}
        </span>
      </div>
      <p>If you did not request this, please ignore this message.</p>
    </div>
  </body>
</html>
`;

export const employeeCreationTemplate = (data) => `
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:22px;">
    <div style="max-width:650px; margin:auto; background:#ffffff; padding:28px; border-radius:10px; box-shadow:0 4px 14px rgba(0,0,0,0.1);">

      <h2 style="color:#00325f; text-align:center; margin-bottom:8px;">
        Welcome to ${data.organizationName}
      </h2>
      <p style="text-align:center; color:#777; font-size:13px; margin-top:0;">
        We are delighted to have you join our team
      </p>

      <hr style="border:none; border-top:1px solid #e1e1e1; margin:16px 0;" />

      <p style="font-size:15px;">
        Dear <strong>${data.name}</strong>,
      </p>

      <p style="font-size:15px; color:#333; line-height:1.7;">
        We are pleased to inform you that your employee account has been successfully created on the
        <strong>${
          data.organizationName
        }</strong> HRMS portal. Please find your account credentials and
        profile details below.
      </p>

      <div style="background:#f3f7ff; padding:18px; border-radius:8px; border:1px solid #d7e3ff; margin:22px 0;">
        <p><strong>Employee ID:</strong> ${data.employeeId}</p>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Designation:</strong> ${data.designation || 'N/A'}</p>
        <p><strong>Login ID:</strong> ${data.loginId}</p>
        <p><strong>Password:</strong> ${data.password}</p>
      </div>

      <p style="font-size:14px; color:#444; line-height:1.7;">
         <strong>Security Note:</strong><br/>
        Please log in to your account and change your password immediately after your first login to
        ensure the security of your account.
      </p>

      <p style="font-size:14px; color:#444; line-height:1.7;">
        If you require any assistance or face any difficulty while logging in, please feel free to
        reach out to the HR or IT support team.
      </p>

      <p style="margin-top:28px; font-size:15px; color:#333;">
        Best Regards,<br/>
        <strong>${data.organizationName} Team</strong>
      </p>

      <hr style="border:none; border-top:1px solid #e1e1e1; margin:20px 0;" />

      <p style="text-align:center; color:#777; font-size:12px;">
        This is a system-generated email. Please do not reply.<br/>
        © ${new Date().getFullYear()} ${
  data.organizationName
}. All Rights Reserved.
      </p>

    </div>
  </body>
</html>
`;

export const organizationEmailVerificationTemplate = (
  organizationName,
  url
) => `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Email Verification</title>

    <style>
        @media only screen and (max-width: 600px) {
            .container {
                width: 95% !important;
                padding: 18px !important;
            }
        }
    </style>
</head>

<body style="margin:0; padding:0; background:#f4f6fa; font-family:Arial, Helvetica, sans-serif;">
    <div style="padding:25px 0;">
        <div class="container" style="
      max-width:650px;
      margin:auto;
      background:#ffffff;
      border-radius:10px;
      padding:28px;
      box-shadow:0 4px 16px rgba(0,0,0,0.08);
      border:1px solid #eaeaea;
    ">

            <div style="text-align:center; margin-bottom:18px;">
                <h2 style="margin:0; color:#00325f; font-size:22px;">
                    Email Verification Required
                </h2>
            </div>

            <hr style="border:none; border-top:1px solid #e6e6e6; margin:18px 0;" />

            <p style="font-size:15px; color:#333;">
                Hello <strong>${organizationName} Team</strong>,
            </p>

            <p style="font-size:15px; color:#444; line-height:1.7;">
                Welcome aboard! 🎉 <br />
                Your registration is almost complete.<br />
               Please complete the email verification process to activate your account and log in.
            </p>

            <div style="text-align:center; margin:28px 0;">
                <a href="${url}" style="
            background:#00325f;
            color:#ffffff;
            padding:12px 22px;
            font-size:15px;
            text-decoration:none;
            border-radius:6px;
            display:inline-block;
            font-weight:600;
            letter-spacing:0.3px;
          ">
                    Verify Email
                </a>
            </div>

            <p style="font-size:14px; color:#555; line-height:1.6;">
                This verification link is valid for a limited time.
                If you did not initiate this registration, please ignore this email.
            </p>

            <p style="font-size:15px; color:#333; margin-top:25px;">
                Regards,<br />
                <strong>EMPTHICS</strong>
            </p>

            <hr style="border:none; border-top:1px solid #eeeeee; margin:22px 0;" />

            <div style="text-align:center;">
                <p style="font-size:12px; color:#888;">
                    Need help? Contact support anytime.<br />
                    © ${new Date().getFullYear()} Empthics — All Rights Reserved
                </p>
            </div>

        </div>
    </div>
</body>

</html>
`;
