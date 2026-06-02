# ScriptumAI — Mobile

Android mobile application for the ScriptumAI document management platform.

## Tech Stack

- **Language:** Kotlin
- **UI:** Jetpack Compose
- **Architecture:** MVVM
- **Notifications:** Firebase Cloud Messaging (FCM)

## Features

- Login, registration, and password recovery
- Document upload (camera scan + file picker)
- AI-powered document analysis and chat
- Organization and department management
- Push notifications
- Dark mode support

## Getting Started

### Prerequisites

- Android Studio (latest stable)
- Android SDK 26+
- A running instance of the [ScriptumAI API](../api)

### Setup

1. Open the `mobile/` folder in Android Studio
2. Copy and configure your `google-services.json` in `app/`
3. Set the API base URL in your environment config
4. Run the app on an emulator or physical device

## User Guide

See [`App_User_Guide.pdf`](./App_User_Guide.pdf) for a full walkthrough of the app features.
