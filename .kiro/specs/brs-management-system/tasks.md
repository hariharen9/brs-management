# Implementation Plan

- [ ] 1. Project setup and core infrastructure
  - Initialize React project with TypeScript and Vite
  - Install and configure Shadcn/ui, Tailwind CSS, and Framer Motion
  - Set up project structure with organized folders for components, hooks, services
  - Configure ESLint, Prettier, and TypeScript strict mode
  - _Requirements: 9.1, 9.2_

- [ ] 1.1 Configure Supabase integration
  - Install Supabase client and React Query
  - Create Supabase client configuration with environment variables
  - Set up TypeScript types for Supabase generated types
  - _Requirements: 8.1, 9.1_

- [ ] 1.2 Set up routing and layout structure
  - Install and configure React Router v6
  - Create main layout component with responsive navigation
  - Set up route structure for dashboard, transaction form, and rate master
  - _Requirements: 1.1, 1.2_

- [ ] 2. Database schema and Supabase setup
  - Create clients table with id, name, contact_person fields
  - Create transactions table with all required fields and constraints
  - Create rates table with client relationships and unique constraints
  - Set up Row Level Security policies for all tables
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [ ] 2.1 Create database seed data and migrations
  - Write SQL migration files for table creation
  - Create sample clients and rates for development testing
  - Set up database functions for complex queries if needed
  - _Requirements: 9.2, 9.3_

- [ ] 3. Core TypeScript interfaces and types
  - Define Client, Transaction, Rate interfaces matching database schema
  - Create ClientKPIs and BalanceSummaryItem types for computed data
  - Set up form validation schemas using Zod
  - Create API response types and error handling types
  - _Requirements: 9.2, 9.3, 9.4_

- [ ] 4. Supabase service layer and data fetching
  - Create client service functions for CRUD operations
  - Implement transaction service with rate lookup logic
  - Create rate service for rate management operations
  - Set up React Query hooks for data fetching with caching
  - _Requirements: 6.2, 6.3, 8.1, 9.5_

- [ ] 4.1 Implement dynamic rate lookup system
  - Create getRateForTransaction function with priority-based lookup
  - Implement client-specific rate search with fallback to defaults
  - Add rate calculation logic for billing amounts
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 4.2 Set up real-time subscriptions
  - Configure Supabase real-time channels for transactions table
  - Integrate real-time updates with React Query cache invalidation
  - Add visual feedback for real-time updates with toast notifications
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 5. Core UI components with Shadcn/ui
  - Set up Shadcn/ui base components (Button, Card, Table, Form, Input)
  - Create reusable KPI card component with animation support
  - Build responsive data table component with sorting and filtering
  - Create modal and drawer components for forms
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 5.1 Implement responsive navigation system
  - Create tabbed navigation for desktop with client tabs
  - Build mobile dropdown selector for client switching
  - Add "+" tab functionality for adding new clients
  - Implement smooth tab transitions with Framer Motion
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 6. Client dashboard implementation
  - Create ClientDashboard component with tab-based interface
  - Implement dynamic client tab generation from database
  - Build client header section with contact information display
  - Add responsive layout handling for different screen sizes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6.1 Implement KPI cards with real-time updates
  - Create KPI calculation functions for Total Received, Delivered, Balance, Billed
  - Build animated KPI cards with count-up animations
  - Add real-time update handling with visual feedback
  - Implement responsive KPI grid layout (4-col desktop, 2x2 tablet, single mobile)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6.2 Build balance summary table
  - Create balance summary query with GROUP BY component and lot number
  - Implement interactive table with sorting and filtering capabilities
  - Add real-time updates for balance calculations
  - Create responsive table layout with mobile card view
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.3 Create transaction log display
  - Build comprehensive transaction history table
  - Implement pagination and search functionality
  - Add real-time transaction updates with smooth animations
  - Create responsive transaction display with mobile optimization
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 7. Transaction form implementation
  - Create TransactionForm component with React Hook Form
  - Implement form validation using Zod schemas
  - Build dynamic field display based on transaction type
  - Add responsive form layout (modal desktop, full-screen mobile)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7.1 Implement automatic rate population
  - Integrate rate lookup system with form
  - Add loading states for rate fetching
  - Implement fallback handling when no rates found
  - Create rate display with edit capability for manual override
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 7.2 Add transaction save logic
  - Implement separate save logic for "Received" vs "Delivered" transactions
  - Add automatic billing calculation for delivered transactions
  - Create optimistic updates for better user experience
  - Add form submission feedback and error handling
  - _Requirements: 6.4, 6.5_

- [ ] 8. Rate master administration page
  - Create RateMaster component with data table
  - Implement rate CRUD operations with inline editing
  - Add bulk operations for rate management
  - Build responsive rate management interface
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8.1 Add client management functionality
  - Create add new client form with validation
  - Implement client editing and contact information management
  - Add client deletion with proper cascade handling
  - Create client search and filtering capabilities
  - _Requirements: 1.5, 7.1_

- [ ] 9. Animation and interaction enhancements
  - Implement Framer Motion animations for page transitions
  - Add micro-interactions for buttons and cards
  - Create loading animations and skeleton states
  - Add real-time update animations with visual feedback
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 9.1 Performance optimizations
  - Implement virtual scrolling for large transaction lists
  - Add debounced search and filtering
  - Set up code splitting and lazy loading
  - Create service worker for offline functionality
  - _Requirements: 8.1, 8.5_

- [ ] 10. Error handling and validation
  - Implement comprehensive error boundaries
  - Add form validation with real-time feedback
  - Create user-friendly error messages and recovery options
  - Set up logging and error reporting
  - _Requirements: 6.1, 6.2, 6.3, 9.5_

- [ ] 10.1 Accessibility implementation
  - Add WCAG 2.1 AA compliance features
  - Implement keyboard navigation support
  - Add screen reader compatibility
  - Create proper focus management and indicators
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 11. Testing implementation
  - Write unit tests for core business logic functions
  - Create component tests for major UI components
  - Add integration tests for user workflows
  - Set up end-to-end testing for critical paths
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

- [ ] 11.1 Performance testing
  - Test real-time update performance with large datasets
  - Validate responsive design across different devices
  - Measure and optimize bundle size and loading times
  - Test offline functionality and service worker behavior
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Final integration and deployment setup
  - Configure environment variables for production
  - Set up build optimization and deployment pipeline
  - Create production Supabase project and migration scripts
  - Test complete user workflows end-to-end
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_