# LendWise Landing Page

## Quick Start - For David

### Step 1: Open a new terminal in VS Code
- Press `Ctrl+Shift+` ` (backtick) for a new terminal

### Step 2: Navigate to the project
```bash
cd /mnt/c/Users/dyoun/Active\ Projects/LendWiseLanding
```

### Step 3: Install dependencies (first time only)
```bash
npm install
```

### Step 4: Start the server
```bash
npm start
```

### Step 5: Open in browser
Go to: http://localhost:3005

---

## What This Is

This is your "Coming Soon" landing page for LendWise Mortgage. You can send this link to loan officers to show them what you're building with Mission Control.

## Features

- **Progress Tracking**: Shows what's complete, in progress, and planned
- **Email Collection**: Captures emails for your early access list
- **Professional Design**: Clean, modern look that builds trust
- **Mobile Responsive**: Looks great on all devices

## Project Structure

```
LendWiseLanding/
├── index.html     (Main page structure)
├── styles.css     (All the styling)
├── script.js      (Interactive features)
├── server.js      (Simple web server)
└── package.json   (Project configuration)
```

## Customizing Content

To update progress percentages or add new features:
1. Open `index.html`
2. Find the progress cards section
3. Update the percentages or add new cards

## Email Collection

Currently, emails are just shown in a success message. To actually save them:
- You'll need to connect to a backend service
- Consider using services like Mailchimp or SendGrid
- Or save to a database

## Deployment Options

When ready to go live:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect to GitHub
- **Your own domain**: Upload files to hosting

---

*Built for LendWise Mortgage - Mission Control Coming Soon!*