# Requirements Document

## Introduction

A web-based total input and output management system for BRS Industries, a shot blasting company. The system will replace an Excel-based workflow management solution, providing real-time tracking of materials received from clients, work completed, billing calculations, and comprehensive client status overview. The application will use React for the frontend and Supabase for backend services including database and real-time capabilities.

## Glossary

- **BRS_System**: The web-based management application for BRS Industries
- **Client_Dashboard**: The main interface displaying client information in tabs
- **Transaction_Log**: Historical record of all material movements and work performed
- **Rate_Master**: Administrative interface for managing pricing structures
- **Balance_Summary**: Real-time report showing current inventory status per client
- **KPI_Cards**: Key Performance Indicator summary displays
- **Transaction_Entry**: Form interface for adding new material movements
- **Dynamic_Rate_Logic**: Automated pricing calculation system
- **Real_Time_Updates**: Live data synchronization using Supabase subscriptions

## Requirements

### Requirement 1

**User Story:** As a BRS Industries operator, I want to view all clients in a tabbed interface, so that I can quickly switch between different client accounts and see their current status.

#### Acceptance Criteria

1. THE BRS_System SHALL display client names as individual tabs in the main navigation
2. WHEN a client tab is selected, THE BRS_System SHALL display all information specific to that client only
3. THE BRS_System SHALL generate client tabs automatically from the clients database table
4. THE BRS_System SHALL provide a "+" tab for adding new clients
5. WHEN the "+" tab is clicked, THE BRS_System SHALL display a form with fields for company name and contact details

### Requirement 2

**User Story:** As a BRS Industries operator, I want to see key performance indicators for each client, so that I can quickly assess their current status and business metrics.

#### Acceptance Criteria

1. WHEN a client tab is active, THE BRS_System SHALL display four KPI cards showing Total Received, Total Delivered, Current Balance, and Total Billed
2. THE BRS_System SHALL calculate Total Received as the sum of all qty_in values for the selected client
3. THE BRS_System SHALL calculate Total Delivered as the sum of all qty_out values for the selected client
4. THE BRS_System SHALL calculate Current Balance as Total Received minus Total Delivered
5. THE BRS_System SHALL calculate Total Billed as the sum of all billed_amount values for the selected client

### Requirement 3

**User Story:** As a BRS Industries operator, I want to see a balance summary report for each client, so that I can track inventory levels by component and lot number.

#### Acceptance Criteria

1. WHEN a client tab is active, THE BRS_System SHALL display a balance summary table grouped by Component Name and Lot No
2. THE BRS_System SHALL show columns for Total In, Total Out, and calculated Balance for each component-lot combination
3. THE BRS_System SHALL update the balance summary in real-time when new transactions are added
4. THE BRS_System SHALL calculate Total In as sum of qty_in for each component-lot combination
5. THE BRS_System SHALL calculate Balance as Total In minus Total Out for each row

### Requirement 4

**User Story:** As a BRS Industries operator, I want to view a complete transaction history for each client, so that I can track all material movements and work performed over time.

#### Acceptance Criteria

1. WHEN a client tab is active, THE BRS_System SHALL display a detailed transaction log below the balance summary
2. THE BRS_System SHALL show columns for Date, DC No, Component, Lot No, Transaction Type, Qty In, Qty Out, Work Type, Rate Applied, and Billed Amount
3. THE BRS_System SHALL display transactions in chronological order with most recent first
4. THE BRS_System SHALL provide an "Add New Transaction" button that navigates to the transaction entry form
5. THE BRS_System SHALL update the transaction log in real-time when new entries are added

### Requirement 5

**User Story:** As a BRS Industries operator, I want to add new transactions for material receipt and delivery, so that I can maintain accurate records of all business activities.

#### Acceptance Criteria

1. WHEN the "Add New Transaction" button is clicked, THE BRS_System SHALL navigate to a transaction entry form
2. THE BRS_System SHALL pre-fill the Client Name field with the currently selected client
3. THE BRS_System SHALL provide a date picker defaulting to the current date
4. THE BRS_System SHALL require selection of Transaction Type as either "Received" or "Delivered"
5. WHEN "Delivered" is selected, THE BRS_System SHALL display additional fields for Work Type and Unit

### Requirement 6

**User Story:** As a BRS Industries operator, I want the system to automatically calculate billing amounts, so that I can ensure accurate invoicing without manual calculations.

#### Acceptance Criteria

1. WHEN Transaction Type is "Delivered", THE BRS_System SHALL automatically populate the Rate field based on dynamic rate logic
2. THE BRS_System SHALL first search for client-specific rates matching client, component, work type, and unit
3. IF no client-specific rate exists, THEN THE BRS_System SHALL use default rates where client_id is NULL
4. WHEN a transaction is saved with Transaction Type "Delivered", THE BRS_System SHALL calculate billed_amount as quantity multiplied by rate_applied
5. THE BRS_System SHALL store the calculated billed_amount in the transactions table

### Requirement 7

**User Story:** As a BRS Industries administrator, I want to manage pricing rates for different clients and services, so that I can maintain accurate billing calculations.

#### Acceptance Criteria

1. THE BRS_System SHALL provide a Rate Master page accessible to administrators
2. THE BRS_System SHALL display a table showing all current rates with columns for Client, Component Name, Work Type, Unit, and Rate
3. THE BRS_System SHALL provide a form to add new rates with the same field structure
4. THE BRS_System SHALL allow creation of default rates by setting client_id to NULL
5. THE BRS_System SHALL validate that rate entries have all required fields completed

### Requirement 8

**User Story:** As a BRS Industries operator, I want real-time updates across the application, so that I can see current data without manual page refreshes.

#### Acceptance Criteria

1. THE BRS_System SHALL use Supabase real-time subscriptions for live data updates
2. WHEN a new transaction is added, THE BRS_System SHALL automatically update KPI cards for the relevant client
3. WHEN a new transaction is added, THE BRS_System SHALL automatically update the balance summary table
4. WHEN a new transaction is added, THE BRS_System SHALL automatically update the transaction log
5. THE BRS_System SHALL maintain real-time synchronization across all client tabs and data views

### Requirement 9

**User Story:** As a BRS Industries operator, I want the system to store data reliably in a structured database, so that I can maintain data integrity and enable complex queries.

#### Acceptance Criteria

1. THE BRS_System SHALL use Supabase SQL database for data storage
2. THE BRS_System SHALL maintain a clients table with id, name, and contact_person fields
3. THE BRS_System SHALL maintain a transactions table with all required transaction fields
4. THE BRS_System SHALL maintain a rates table with client_id, component, work_type, unit, and rate fields
5. THE BRS_System SHALL enforce referential integrity between clients and transactions tables