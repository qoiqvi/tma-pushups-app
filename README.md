# Telegram Mini App Boilerplate

A modern, production-ready boilerplate for building Telegram Mini Apps with Next.js, featuring a complete tech stack for rapid development.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) - React framework for production
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) - Lightweight state management
- **Database**: [Supabase](https://supabase.com/) - Open source Firebase alternative
- **Telegram Integration**: [@telegram-apps/sdk-react](https://docs.telegram-mini-apps.com/) - Official Telegram SDK
- **TON Blockchain**: [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview) - TON wallet integration
- **TypeScript**: Full type safety throughout the application

## 📦 Features

- ✅ Telegram Mini App SDK integration
- ✅ TON Connect wallet integration
- ✅ Supabase authentication and database
- ✅ Modern UI components with shadcn/ui
- ✅ Responsive design with Tailwind CSS
- ✅ Type-safe development with TypeScript
- ✅ State management with Zustand
- ✅ Error boundaries and error handling
- ✅ Development tools (Eruda for mobile debugging)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tma-boilerplate
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

For HTTPS development (required for Telegram Mini Apps):

```bash
npm run dev:https
# or
yarn dev:https
# or
pnpm dev:https
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

```
src/
├── app/              # Next.js app router
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   └── ...          # Custom components
├── config/          # Configuration files
├── core/            # Core application logic
├── css/             # CSS utilities
├── hooks/           # Custom React hooks
└── lib/             # Utility libraries
    └── supabase/    # Supabase client configuration
```

## 🚀 Deployment

### Build for production:

```bash
npm run build
npm run start
```

### Deploy to Vercel:

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

## 📱 Telegram Mini App Setup

1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Set up your Mini App URL in BotFather
3. Configure your domain for Telegram Mini Apps
4. Test your app in Telegram

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run dev:https` - Start development server with HTTPS
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.