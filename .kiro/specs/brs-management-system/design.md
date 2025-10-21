# Design Document

## Overview

The BRS Industries Management System is a React-based web application with Supabase backend that replaces Excel-based workflow management. The system provides real-time tracking of materials, work completion, and billing through a tabbed client interface with dynamic rate calculations and live data updates.

## Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **State Management**: React Context API for global state, React Query for server state management
- **Routing**: React Router v6 for navigation between pages
- **UI Components**: Shadcn/ui with Tailwind CSS for modern, animated, and responsive design
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **Real-time Updates**: Supabase real-time subscriptions integrated with React Query

### Backend Architecture
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **API**: Supabase auto-generated REST API and real-time subscriptions
- **Authentication**: Supabase Auth (for future admin access control)
- **Real-time**: Supabase real-time engine for live data synchronization

### Application Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui base components
│   ├── forms/           # Form components with validation
│   ├── tables/          # Data table components
│   └── charts/          # KPI visualization components
├── pages/               # Main application pages
├── hooks/               # Custom React hooks
├── services/            # Supabase client and API calls
├── types/               # TypeScript type definitions
├── utils/               # Helper functions
├── contexts/            # React contexts
└── lib/                 # Utility libraries and configurations
```

## Components and Interfaces

### Core Components

#### 1. ClientDashboard Component
- **Purpose**: Main dashboard with tabbed client interface
- **State**: Active client ID, client list, real-time subscriptions
- **UI Framework**: Shadcn/ui Tabs component with custom styling
- **Responsive Design**: 
  - Desktop: Horizontal tabs with full client data
  - Tablet: Scrollable tabs with condensed layout
  - Mobile: Dropdown selector with stacked content
- **Key Features**:
  - Dynamic tab generation from clients table
  - Client-specific data filtering
  - Real-time KPI updates with smooth animations
  - Add new client functionality with slide-in modal
  - Smooth tab transitions with Framer Motion

#### 2. ClientTab Component
- **Purpose**: Individual client tab content
- **Props**: Client ID, client data
- **UI Components**: Shadcn/ui Card, Table, Button components
- **Responsive Layout**:
  - Desktop: 4-column KPI grid, side-by-side tables
  - Tablet: 2x2 KPI grid, stacked tables
  - Mobile: Single column layout with collapsible sections
- **Sections**:
  - Client header with contact information and avatar
  - Animated KPI cards with count-up animations and trend indicators
  - Interactive balance summary table with sorting and filtering
  - Paginated transaction log table with search functionality
  - Floating action button for adding transactions (mobile-optimized)

#### 3. TransactionForm Component
- **Purpose**: Form for adding new transactions
- **State**: Form data, rate lookup, validation
- **UI Components**: Shadcn/ui Form, Input, Select, DatePicker components
- **Responsive Design**:
  - Desktop: Side-by-side form layout in modal
  - Mobile: Full-screen form with step-by-step wizard
- **Dynamic Fields**: Smooth slide-in animations for work type and unit fields
- **Rate Logic**: Automatic rate population with loading indicators
- **Validation**: Real-time validation with inline error messages
- **UX Enhancements**: Auto-save drafts, keyboard shortcuts, smart defaults

#### 4. RateMaster Component
- **Purpose**: Administrative rate management
- **UI Components**: Shadcn/ui DataTable with advanced features
- **Responsive Design**:
  - Desktop: Full-featured data table with inline editing
  - Tablet: Condensed table with edit modals
  - Mobile: Card-based layout with swipe actions
- **Features**:
  - Interactive data table with sorting, filtering, and pagination
  - Inline editing with optimistic updates
  - Bulk operations for rate management
  - Visual indicators for default vs client-specific rates
  - Search and filter functionality with debounced input
  - Export capabilities for rate data

### Data Interfaces

#### TypeScript Types
```typescript
interface Client {
  id: string;
  name: string;
  contact_person: string;
  created_at: string;
}

interface Transaction {
  id: string;
  client_id: string;
  date: string;
  dc_no: string;
  component: string;
  lot_no: string;
  transaction_type: 'Received' | 'Delivered';
  qty_in: number | null;
  qty_out: number | null;
  work_type: 'Fettling' | 'Shot Blasting' | 'Both' | null;
  unit: 'Per Piece' | 'Per Kg' | null;
  rate_applied: number | null;
  billed_amount: number | null;
  created_at: string;
}

interface Rate {
  id: string;
  client_id: string | null; // null for default rates
  component: string;
  work_type: 'Fettling' | 'Shot Blasting' | 'Both';
  unit: 'Per Piece' | 'Per Kg';
  rate: number;
  created_at: string;
}

interface ClientKPIs {
  totalReceived: number;
  totalDelivered: number;
  currentBalance: number;
  totalBilled: number;
}

interface BalanceSummaryItem {
  component: string;
  lot_no: string;
  total_in: number;
  total_out: number;
  balance: number;
}
```

## Data Models

### Database Schema

#### Clients Table
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  dc_no TEXT NOT NULL,
  component TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('Received', 'Delivered')),
  qty_in DECIMAL(10,2),
  qty_out DECIMAL(10,2),
  work_type TEXT CHECK (work_type IN ('Fettling', 'Shot Blasting', 'Both')),
  unit TEXT CHECK (unit IN ('Per Piece', 'Per Kg')),
  rate_applied DECIMAL(10,2),
  billed_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Rates Table
```sql
CREATE TABLE rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  component TEXT NOT NULL,
  work_type TEXT NOT NULL CHECK (work_type IN ('Fettling', 'Shot Blasting', 'Both')),
  unit TEXT NOT NULL CHECK (unit IN ('Per Piece', 'Per Kg')),
  rate DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, component, work_type, unit)
);
```

### Data Relationships
- Clients have many Transactions (one-to-many)
- Clients have many Rates (one-to-many, nullable for default rates)
- Transactions reference Clients (foreign key)
- Rates reference Clients (foreign key, nullable)

## Core Business Logic

### Dynamic Rate Lookup Algorithm
```typescript
async function getRateForTransaction(
  clientId: string,
  component: string,
  workType: string,
  unit: string
): Promise<number | null> {
  // Priority 1: Client-specific rate
  const clientRate = await supabase
    .from('rates')
    .select('rate')
    .eq('client_id', clientId)
    .eq('component', component)
    .eq('work_type', workType)
    .eq('unit', unit)
    .single();
  
  if (clientRate.data) return clientRate.data.rate;
  
  // Priority 2: Default rate (client_id is null)
  const defaultRate = await supabase
    .from('rates')
    .select('rate')
    .is('client_id', null)
    .eq('component', component)
    .eq('work_type', workType)
    .eq('unit', unit)
    .single();
  
  return defaultRate.data?.rate || null;
}
```

### KPI Calculations
```typescript
async function calculateClientKPIs(clientId: string): Promise<ClientKPIs> {
  const { data } = await supabase
    .from('transactions')
    .select('qty_in, qty_out, billed_amount')
    .eq('client_id', clientId);
  
  const totalReceived = data?.reduce((sum, t) => sum + (t.qty_in || 0), 0) || 0;
  const totalDelivered = data?.reduce((sum, t) => sum + (t.qty_out || 0), 0) || 0;
  const totalBilled = data?.reduce((sum, t) => sum + (t.billed_amount || 0), 0) || 0;
  
  return {
    totalReceived,
    totalDelivered,
    currentBalance: totalReceived - totalDelivered,
    totalBilled
  };
}
```

### Balance Summary Query
```sql
SELECT 
  component,
  lot_no,
  SUM(qty_in) as total_in,
  SUM(qty_out) as total_out,
  SUM(qty_in) - SUM(qty_out) as balance
FROM transactions 
WHERE client_id = $1 
GROUP BY component, lot_no
ORDER BY component, lot_no;
```

## Real-time Updates Implementation

### Supabase Real-time Setup with UI Feedback
```typescript
// Subscribe to transaction changes with visual feedback
const subscription = supabase
  .channel('transactions')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'transactions' },
    (payload) => {
      // Show toast notification for new transactions
      toast.success('Transaction updated in real-time');
      
      // Animate affected components
      triggerUpdateAnimation(payload.new.client_id);
      
      // Invalidate React Query cache for affected client
      queryClient.invalidateQueries(['client-data', payload.new.client_id]);
    }
  )
  .subscribe();
```

### React Query Integration with Optimistic Updates
```typescript
// Custom hook for client data with real-time updates and animations
function useClientData(clientId: string) {
  return useQuery({
    queryKey: ['client-data', clientId],
    queryFn: () => fetchClientData(clientId),
    staleTime: 0, // Always refetch on focus
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      // Trigger count-up animations for KPIs
      animateKPIUpdates(data.kpis);
    }
  });
}
```

### Animation and Feedback System
```typescript
// Framer Motion variants for smooth transitions
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  updated: { 
    scale: [1, 1.02, 1], 
    transition: { duration: 0.5 } 
  }
};

// Real-time update indicators
const UpdateIndicator = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full"
  />
);
```

## Error Handling

### Frontend Error Boundaries
- React Error Boundary components for graceful error handling
- Toast notifications for user-facing errors
- Loading states and error states for all async operations

### Backend Error Handling
- Database constraint violations (unique constraints, foreign keys)
- Rate lookup failures (fallback to manual entry)
- Network connectivity issues (offline state handling)

### Validation Strategy
- Client-side validation using React Hook Form with Zod schemas
- Server-side validation through Supabase RLS policies
- Real-time validation feedback for form inputs

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Business logic testing for rate calculations and KPI computations
- Custom hook testing for data fetching and real-time updates

### Integration Testing
- End-to-end user workflows (add client, create transaction, view reports)
- Database integration testing with test Supabase instance
- Real-time functionality testing

### Performance Considerations
- React Query caching to minimize database calls
- Optimistic updates for better user experience
- Virtual scrolling for large transaction lists
- Debounced search and filtering with loading states
- Image optimization and lazy loading
- Code splitting and dynamic imports for faster initial load
- Service worker for offline functionality
- Skeleton loading states for better perceived performance
- Intersection Observer for lazy loading table rows

## Security Considerations

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rates ENABLE ROW LEVEL SECURITY;

-- Example policy (to be refined based on auth requirements)
CREATE POLICY "Users can view all data" ON clients FOR SELECT USING (true);
```

### Data Validation
- Input sanitization for all user inputs
- SQL injection prevention through parameterized queries
- XSS prevention through proper React rendering

## Deployment Architecture

### Frontend Deployment
- Static site hosting (Vercel/Netlify)
- Environment-based configuration for Supabase endpoints
- Build optimization and code splitting

### Backend Configuration
- Supabase project setup with proper environment separation
- Database migrations for schema management
- Backup and recovery procedures

## Responsive Design Strategy

### Breakpoint System
```typescript
// Tailwind CSS breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large desktop
};
```

### Mobile-First Approach

#### Navigation
- **Mobile**: Bottom navigation with icons
- **Tablet**: Side navigation drawer
- **Desktop**: Top navigation with full labels

#### Data Tables
- **Mobile**: Card-based layout with swipe actions
- **Tablet**: Horizontal scroll with sticky columns
- **Desktop**: Full table with all columns visible

#### Forms
- **Mobile**: Single column, full-screen modals
- **Tablet**: Two-column layout in modals
- **Desktop**: Inline editing where appropriate

#### KPI Cards
- **Mobile**: Single column stack
- **Tablet**: 2x2 grid
- **Desktop**: 4-column row

## Animation and Interaction Design

### Micro-interactions
```typescript
// Button hover effects
const buttonVariants = {
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 }
};

// Card hover effects
const cardHoverVariants = {
  hover: { 
    y: -4, 
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    transition: { duration: 0.2 }
  }
};

// Loading animations
const spinnerVariants = {
  animate: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: "linear" } }
};
```

### Page Transitions
- Smooth fade transitions between routes
- Slide animations for modal dialogs
- Stagger animations for list items
- Skeleton loading for data fetching states

### Real-time Feedback
- Pulse animations for live data updates
- Color transitions for status changes
- Count-up animations for numerical values
- Toast notifications for user actions

## Accessibility Features

### WCAG 2.1 AA Compliance
- Proper heading hierarchy (h1-h6)
- Alt text for all images and icons
- Keyboard navigation support
- Focus indicators for all interactive elements
- Color contrast ratios meeting AA standards
- Screen reader compatibility

### Keyboard Shortcuts
- Tab navigation through all interactive elements
- Enter/Space for button activation
- Arrow keys for table navigation
- Escape to close modals and dropdowns

### Touch Accessibility
- Minimum 44px touch targets
- Swipe gestures for mobile interactions
- Long press for context menus
- Haptic feedback for mobile devices

## Progressive Web App Features

### Service Worker Implementation
- Offline data caching
- Background sync for form submissions
- Push notifications for important updates
- App-like installation experience

### Performance Optimizations
- Critical CSS inlining
- Resource preloading
- Image optimization with WebP/AVIF
- Bundle splitting and lazy loading
- Compression and minification