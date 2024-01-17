import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import React from "react";

export default function GoogleCaptchaWrapper({
    children,
}: {
    children: React.ReactNode;
}) {

    const recaptchaKey = process.env.REACT_APP_reCAPTCHA_SITE_KEY;
	// const recaptchaKey = '1234';
	console.log('PROCESS', process.env)
    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={recaptchaKey ?? "NOT DEFINED"}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
}