# BRS Management System

A comprehensive web-based management system for BRS Industries, a shot blasting company. This system replaces Excel-based workflow management with real-time tracking of materials, work completion, and billing calculations.

## Features

- **Client Dashboard**: Tabbed interface for managing multiple clients
- **Real-time KPIs**: Track Total Received, Delivered, Balance, and Billed amounts
- **Balance Summary**: Component and lot-wise inventory tracking
- **Transaction Management**: Record material receipts and deliveries
- **Dynamic Rate System**: Automatic billing calculations with client-specific rates
- **Real-time Updates**: Live data synchronization using Supabase subscriptions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: Enhanced UX with Framer Motion

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: React Query + React Context
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Routing**: React Router v6

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd brs-management-system
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env` and update with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the contents of `database/schema.sql`

This will create:
- Tables: `clients`, `transactions`, `rates`
- Sample data for testing
- RPC functions for complex queries
- Proper indexes and constraints

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui base components
│   ├── ClientDashboard.tsx
│   ├── KPICard.tsx
│   ├── BalanceSummaryTable.tsx
│   └── TransactionLogTable.tsx
├── hooks/               # Custom React hooks
│   ├── useClients.ts
│   └── useTransactions.ts
├── services/            # Supabase API services
│   ├── clients.ts
│   ├── transactions.ts
│   └── rates.ts
├── types/               # TypeScript definitions
│   ├── index.ts
│   └── database.ts
├── lib/                 # Utility libraries
│   ├── supabase.ts
│   ├── queryClient.ts
│   └── utils.ts
└── App.tsx              # Main application component
```

## Database Schema

### Tables

- **clients**: Client information (id, name, contact_person)
- **transactions**: All material movements (received/delivered)
- **rates**: Pricing structure (client-specific and default rates)

### Key Features

- **Dynamic Rate Lookup**: Automatic rate selection with client-specific priority
- **Balance Calculations**: Real-time inventory tracking by component and lot
- **Referential Integrity**: Proper foreign key relationships
- **Row Level Security**: Prepared for future authentication

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. **Database Changes**: Update `database/schema.sql`
2. **Types**: Update `src/types/database.ts` and `src/types/index.ts`
3. **Services**: Add API functions in `src/services/`
4. **Hooks**: Create React Query hooks in `src/hooks/`
5. **Components**: Build UI components in `src/components/`

## Deployment

### Frontend (Vercel/Netlify)

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Set environment variables in your hosting platform

### Database (Supabase)

1. Your Supabase project is automatically hosted
2. For production, consider upgrading to a paid plan
3. Set up proper Row Level Security policies for authentication

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push and create a Pull Request

## License

This project is licensed under the MIT License.