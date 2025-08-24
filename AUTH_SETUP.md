<!-- @format -->

# Authentication Setup Guide

This application supports both Google OAuth and Magic Link authentication using InstantDB.

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# InstantDB Configuration
NEXT_PUBLIC_INSTANTDB_APP_ID=your-instantdb-app-id-here

# Google OAuth Configuration (Optional - for Google sign-in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
NEXT_PUBLIC_GOOGLE_CLIENT_NAME=your-google-client-name-here
```

## Setup Steps

### 1. InstantDB Setup

1. Go to [InstantDB Dashboard](https://instantdb.com/dashboard)
2. Create a new app or use your existing app
3. Copy your App ID and add it to `NEXT_PUBLIC_INSTANTDB_APP_ID`

### 2. Google OAuth Setup (Optional)

If you want to enable Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add your domain to authorized origins
6. Copy the Client ID to `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
7. In your InstantDB dashboard, go to the Auth tab
8. Add Google as an authentication provider
9. Copy the client name to `NEXT_PUBLIC_GOOGLE_CLIENT_NAME`

### 3. Magic Link Setup

Magic link authentication is automatically enabled with InstantDB. No additional setup required.

## Features

-   **Google OAuth**: Users can sign in with their Google account
-   **Magic Link**: Users receive a verification code via email
-   **Automatic Account Creation**: New accounts are created automatically
-   **Persistent Sessions**: Users stay logged in across browser sessions
-   **Sign Out**: Users can sign out from the dashboard

## Usage

The authentication flow is handled automatically:

1. Unauthenticated users see the login page
2. Users can choose between Google OAuth or Magic Link
3. After successful authentication, users see the main dashboard
4. The dashboard shows user information and app features
5. Users can sign out using the button in the top-right corner

## Components

-   `AuthWrapper`: Handles authentication state and conditionally renders login or main content
-   `LoginPage`: The login interface with Google OAuth and Magic Link options
-   `UserDashboard`: The main app interface shown after authentication
