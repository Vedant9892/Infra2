# React Native InfraTrace App

A Construction Field Management Mobile App built with Expo and React Native.

## 🚀 How to Run

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Expo Go app on your phone (for testing)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

3. **Run on your device:**
   - Scan the QR code with Expo Go app (Android)
   - Scan with Camera app (iOS) - it will open Expo Go
   
   Or run on emulator:
   ```bash
   # Android
   npx expo start --android
   
   # iOS (Mac only)
   npx expo start --ios
   ```

## 📱 Features

- **Role-based Login**: Labour, Supervisor, Engineer, Site Owner
- **Multilingual Support**: English, Hindi, Marathi
- **Attendance Marking**: GPS + Photo verification
- **Task Management**: View and track construction tasks
- **Statistics Dashboard**: Attendance rate, hours worked, tasks completed
- **Beautiful UI**: Matching the provided design specifications

## 🏗️ Project Structure

```
app/
├── (auth)/
│   └── login.tsx           # Login & role selection
├── (tabs)/
│   ├── _layout.tsx         # Bottom navigation
│   ├── home.tsx            # Main dashboard
│   ├── projects.tsx        # Projects screen
│   ├── stats.tsx           # Statistics
│   └── profile.tsx         # User profile
├── _layout.tsx             # Root layout
└── index.tsx               # Entry point

mobile-components/          # Reusable components
lib/                        # Utilities & API
assets/                     # Images & icons
```

## 🎨 Design System

- **Background**: #F5F3FF
- **Primary Purple**: #6C63FF
- **Soft Yellow**: #FFD166
- **Soft Blue**: #BEE7E8
- **Soft Pink**: #F6C1CC
- **Dark Text**: #1C1C1E
- **Muted Text**: #6E6E73
- **Bottom Nav**: #111111

## 📦 Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (TailwindCSS for React Native)
- **State Management**: React Query + Zustand
- **Backend**: Express + Drizzle ORM (separate server)

## 🌐 Hosting on Expo

### Build & Deploy

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure your project:**
   ```bash
   eas build:configure
   ```

4. **Build for Android/iOS:**
   ```bash
   # Android APK
   eas build --platform android --profile preview
   
   # iOS
   eas build --platform ios --profile preview
   ```

5. **Publish updates:**
   ```bash
   eas update --branch production
   ```

### Expo Go Development

For quick testing, just run:
```bash
npx expo start
```

Then scan the QR code with Expo Go app. Your app will be available instantly!

## 🔗 Backend Setup

The backend server is in the `server/` directory. Run it separately:

```bash
# In a separate terminal
npm run dev
```

Make sure to update the API_BASE_URL in `lib/api.ts` if deploying to production.

## 📝 Notes

- The app uses mock data for now
- OTP authentication is simulated
- GPS and camera permissions are configured in app.json
- All screens follow the exact design specifications provided

## 🇮🇳 Indian Context

- Uses Indian names, locations, and context
- Multilingual support for Indian languages
- Simple, respectful, practical language tone
- Designed for Indian construction sites

---

Built with ❤️ for Indian Construction Workers
