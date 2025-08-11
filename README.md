# Gas Sight Stream - IoT Sensor Monitoring Dashboard

## Project info

**URL**: https://lovable.dev/projects/65a68558-f71d-4f50-b794-4b2a9f21cf2d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/65a68558-f71d-4f50-b794-4b2a9f21cf2d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## New Features Added

### 🔴 Live Updates
- **Real-time data streaming** using Supabase WebSocket subscriptions
- **Automatic chart refresh** when new sensor data arrives
- **Live notifications** when new data is received

### 💬 Interactive Commenting System
- **Click any data point** on charts to add comments
- **User identification** with optional name entry
- **Persistent comments** stored in database
- **Real-time comment updates** across all users
- **Comment history** for each data point

### 📊 Enhanced Chart Experience
- **Horizontal scrolling** for detailed time-series analysis
- **Responsive chart sizing** based on data points
- **Improved X-axis** with better label positioning
- **Click-to-comment** interaction on all chart types

### 🔌 Disconnection Gap Visualization
- **Intelligent gap detection** when data is missing for >10 minutes
- **Visual separation** of disconnected periods
- **connectNulls={false}** to show data interruptions
- **Clear indication** of sensor connectivity issues

### 📱 User Experience Improvements
- **Toast notifications** for real-time feedback
- **Dialog-based commenting** with clean UI
- **Scroll areas** for long comment lists
- **Responsive design** for all screen sizes

## What technologies are used for this project?

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript development
- **React 18** - Modern React with hooks and concurrent features
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service with real-time capabilities
- **Recharts** - Composable charting library for React
- **Date-fns** - Modern JavaScript date utility library
- **Sonner** - Toast notifications for React

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/65a68558-f71d-4f50-b794-4b2a9f21cf2d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
