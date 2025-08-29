# OpenBench Frontend

A modern, responsive frontend for the OpenBench LLM evaluation platform built with Next.js 14, TypeScript, and TailwindCSS.

## 🚀 Features

### ✅ **Implemented**
- **🏠 Home Page** - Hero section, quick stats, featured tests, top models
- **🏆 Leaderboard** - Multi-metric comparison with filters and charts
- **🤖 Models** - Catalog and detailed model pages with performance analytics
- **📝 Tests** - Directory, detail pages, and submission wizard
- **👨‍💼 Admin** - Dashboard and moderation queue for content management
- **🔄 Real-time Updates** - Live job status and result updates via Supabase
- **🎨 Modern UI** - shadcn/ui components with dark mode support
- **📱 Responsive** - Mobile-first design that works on all devices
- **🔐 Authentication** - NextAuth with OAuth providers (GitHub, Google)
- **📊 Data Visualization** - Charts and graphs using Recharts
- **🔍 Search & Filters** - Advanced filtering and search capabilities

### 🛠 **Tech Stack**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Auth**: NextAuth.js
- **Real-time**: Supabase Realtime
- **Charts**: Recharts
- **Animations**: Framer Motion (ready)
- **Notifications**: Sonner

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables in `.env.local`:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here

   # OAuth Providers
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Supabase Configuration (for Realtime)
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── models/            # Model catalog and details
│   ├── tests/             # Test directory and details
│   └── leaderboard/       # Leaderboard page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── home/             # Home page components
│   ├── models/           # Model-related components
│   ├── tests/            # Test-related components
│   ├── admin/            # Admin components
│   └── leaderboard/      # Leaderboard components
├── hooks/                # Custom React hooks
│   ├── api.ts           # TanStack Query hooks
│   └── realtime.ts      # Realtime subscription hooks
├── lib/                  # Utility libraries
│   ├── api.ts           # API client
│   ├── auth.ts          # NextAuth configuration
│   ├── react-query.tsx  # Query client setup
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Utility functions
├── services/            # API service functions
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## 🎨 Design System

The frontend uses a consistent design system built on:

- **Colors**: Primary brand colors with semantic variants
- **Typography**: Inter font with consistent sizing scale
- **Components**: shadcn/ui component library
- **Spacing**: TailwindCSS spacing scale
- **Icons**: Lucide React icons
- **Dark Mode**: Automatic system preference detection

## 🔄 Real-time Features

The application includes real-time updates for:

- **Job Status**: Live updates when test executions start/complete
- **Test Results**: Real-time result updates during test runs
- **Moderation**: Live updates when tests are approved/rejected
- **Model Status**: Updates when model availability changes

## 📊 Data Flow

1. **API Client**: Centralized HTTP client with error handling
2. **TanStack Query**: Caching and synchronization of server state
3. **Realtime**: Supabase subscriptions for live updates
4. **Forms**: React Hook Form with Zod validation
5. **Auth**: NextAuth session management

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Adding New Components

1. Use shadcn/ui CLI to add new UI components:
   ```bash
   npx shadcn@latest add [component-name]
   ```

2. Create custom components in the appropriate directory
3. Export from index files for clean imports
4. Follow the established patterns for TypeScript types

### API Integration

- API hooks are located in `src/hooks/api.ts`
- Service functions are in `src/services/api.ts`
- Types are defined in `src/types/api.ts`
- Follow TanStack Query patterns for caching and invalidation

## 🚀 Deployment

The application is designed to be deployed on Vercel:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Environment Variables for Production

Ensure all environment variables are configured in your deployment platform:

- API endpoints
- Authentication secrets
- OAuth provider credentials
- Supabase configuration
- Analytics keys (if used)

## 🤝 Contributing

1. Follow the established code patterns
2. Use TypeScript strictly
3. Add proper error handling
4. Update types when adding new features
5. Test responsive design
6. Ensure accessibility standards

## 📝 Notes

- **Mock Data**: The application includes comprehensive mock data for development and testing
- **Error Boundaries**: Global error handling with user-friendly messages
- **Performance**: Optimized with React Query caching and Next.js optimizations
- **SEO**: Server-side rendering for public pages with proper meta tags
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels

## 🔗 Related

- [Backend Repository](../README.md) - FastAPI backend
- [Technical Design](../docs/frontend-technical-design.md) - Detailed architecture
- [API Documentation](../docs/api.md) - Backend API reference

---

Built with ❤️ by the OpenBench community