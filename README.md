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

To enable **Check number**, add `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` to
the Vercel project's environment variables and redeploy. The function uses
Twilio Basic Lookup for validation and numbering country. It does not request
paid data packages. The saved list and ChatGPT prompt work without credentials.

## Google caller research

Add GEMINI_API_KEY in Production and redeploy to enable Google Search through
Gemini when Check number is pressed. The Google API receives the selected
number. A completed search without a public company match shows a caution
flag. Provider failures, missing credentials, or responses without evidence
that the number was searched do not produce a scam label.
