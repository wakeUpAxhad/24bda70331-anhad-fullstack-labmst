# Healthcare Consultation System

A consultation booking website with a responsive public page, Node.js API, and local persistent storage. It uses Node.js built-ins and has no third-party runtime dependencies. The server binds to this computer only; the website is not published online.

## Run locally

1. Install [Node.js](https://nodejs.org/) if it is not already installed.
2. Double-click `start.bat` to start the local server and open the site in Chrome (if installed) or your default browser.

You can also run `npm start` in this folder, then open `http://127.0.0.1:8080` in Chrome, Opera GX, Edge, Firefox, or another modern browser.

Booking requests are checked by the server and saved to `data/consultations.json`. The data file is excluded from Git. Stop the server with Ctrl+C.

## Before real use

This is a local prototype, not a production healthcare records system. The local JSON file is not encrypted, and the app has no staff dashboard, email notifications, or appointment calendar. Use test data only.
