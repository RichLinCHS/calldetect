# Caller Lookup

A browser app that saves numbers from Phone Recents on the current browser and
lets you reopen each one. Use **Copy AI lookup prompt** and paste it into ChatGPT
to research public business matches and spam reports. The Vercel app does not
integrate with the native iPhone call screen or read the iPhone call log.

## Run locally

Use Node.js 22 and run `npm start`. Open http://127.0.0.1:4173.

## Deploy on Vercel

Push this repository to your Git provider and import it in Vercel with the
default settings. Alternatively run `npx vercel --prod` from this folder and sign
in when requested. The checked-in configuration serves `public/` and the
`api/lookup.js` function.

To enable **Check number**, add `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` to
the Vercel project's environment variables and redeploy. The function uses
Twilio Basic Lookup for validation and numbering country. It does not request
paid data packages. The saved list and ChatGPT prompt work without credentials.
