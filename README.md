# Fusion Sales Automation Platform

## What is Fusion Sales?

Fusion Sales is a multi-tenant sales automation platform designed to support the complete sales lifecycle within a single, structured system. The application enables organisations to manage clients, opportunities, proposals, contracts, activities, pricing requests, and reporting while enforcing strict role-based access and tenant isolation.

The platform is built as a frontend-driven orchestration layer on top of a fixed REST API. It focuses on clean architecture, separation of concerns, and scalability, making it suitable for enterprise environments and academic evaluation.

---

## Why Fusion Sales?

### End-to-End Sales Lifecycle  
Fusion Sales supports the full journey from onboarding a new organisation to closing deals, managing contracts, and handling renewals.

### Multi-Tenant by Design  
Each organisation operates within its own isolated tenant. Users only have access to data belonging to their organisation.

### Role-Based Access Control  
Permissions are enforced consistently across routes, UI actions, and API interactions.

### Client-Centric Structure  
All sales activity is organised around clients, improving clarity, traceability, and accountability.

### Automation-Ready Architecture  
The system supports frontend-driven automation and AI-assisted workflows without requiring backend changes.

---

# Documentation

## Software Requirements Specification (SRS)

### Overview

Fusion Sales is a web-based sales automation system that allows authenticated users within an organisation to manage structured sales workflows. The system supports multiple user roles, enforces tenant isolation, and provides dashboards and reports for sales visibility.

---

## Roles and Permissions

| Role | How Obtained | Access Level |
|---|---|---|
| Admin | Register with tenantName or assigned by another Admin | Full system access including user management, approvals, deletes |
| SalesManager | Join organisation with role SalesManager | Approvals, assignments, deletes |
| BusinessDevelopmentManager | Join organisation with role BDM | Manage opportunities, proposals, pricing, contracts |
| SalesRep | Default role | Read assigned data, create activities and pricing requests |

Role restrictions are enforced through route guards, UI visibility rules, and API-level authorization.

---

## Application Structure

### Navigation by Role

#### Sales Representative
- Dashboard
- Clients
- Opportunities (client-scoped)
- Activities (client-scoped)

#### Admin / Sales Manager
- Dashboard
- Clients
- Opportunities
- Activities
- Reports
- Admin (user management)

---

## Client-Centric Workflow Model

Fusion Sales follows a client-first interaction model.

### Typical User Flow

1. Select or create a client
2. Work within the client workspace:
   - Contacts
   - Opportunities
   - Activities
   - Proposals
   - Contracts
3. Review aggregated metrics via the dashboard

This structure prevents data duplication and ensures all sales activity is clearly attributable to a client.

---

## Providers Architecture

The application uses a consistent four-file provider pattern for each business domain:


### Implemented Providers

- authProvider
- clientProvider
- contactProvider
- opportunityProvider
- proposalProvider
- pricingProvider
- contractProvider
- activityProvider
- dashboardProvider

Each provider owns its state, encapsulates API interaction, and exposes hooks for use in UI components.

---

## Authentication and Authorization

### Authentication Flow

1. User logs in or registers
2. JWT token is stored in cookies
3. Axios interceptor attaches token to every request
4. Session is restored using `/api/auth/me` on refresh

### Route Protection

- Edge-level protection via `proxy.ts`
- In-app role enforcement via `AuthGuard`
- Unauthorized users are redirected appropriately

---

## Automation and Workflow Orchestration

Fusion Sales uses frontend-driven orchestration to automate transitions and recommendations.

### Supported Automation Examples

- Opportunity moved to Closed Won triggers contract creation suggestion
- Proposal approval enables contract creation
- Expiring contracts trigger renewal workflows
- Proposal submission creates follow-up activities

Automation is explicit, role-aware, and always requires user confirmation.

---

## AI-Assisted Setup

The platform supports calling an external LLM from the frontend.

### Example Use Case

- Upload a lead or proposal document
- Extract client, contact, opportunity, and activity data
- Review extracted information
- Automatically create records via existing API endpoints

This reduces manual setup without modifying backend behaviour.

---

## Dashboards and Reporting

### Dashboards
- Pipeline overview
- Activity summaries
- Contract health
- Revenue metrics

### Reports
- Opportunities report
- Sales performance report
- Revenue by time period

Dashboards and reports are read-only aggregations.

---

## Documents and Notes

- Documents can be attached to clients, opportunities, proposals, and contracts
- Notes can be added to any entity
- Selected sections can be exported as PDFs:
  - Proposals
  - Contracts
  - Pricing summaries
  - Reports

---

## Technology Stack

- Frontend: Next.js, React, TypeScript
- UI Framework: Ant Design
- State Management: React Context + Reducers
- API: REST with JWT authentication
- Authentication: Cookie-based JWT
- AI Integration: OpenRouter / OpenAI-compatible API

---

## Environment Variables
NEXT_PUBLIC_API_URL=...
AI_API_KEY=...
AI_BASE_URL=https://openrouter.ai/api/v1

AI_MODEL=openrouter/free
NEXT_PUBLIC_EMAILJS_SERVICE_ID=...
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=...
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=...
NEXT_PUBLIC_EMAIL_INVITE_COMPANY_NAME=Fusion Sales


---

## Running the Application

### Local Setup

1. Clone the repository

git clone https://github.com/RRusso15/fusion-sales


2. Install dependencies

npm install


3. Run the development server

npm run dev


4. Open the application at

http://localhost:3000


---

## Deployment

The application is deployed on Vercel:


https://fusion-sales.vercel.app/login


---

## Development Guidelines

- Provider-based separation of concerns
- Client-centric UI flows
- Role-based UI and route enforcement
- Automation must be explicit and reversible
- No assumptions beyond the documented API contract

---

## Project Management

- GitHub Issues for task tracking
- Kanban board for workflow visibility
- Milestones for development phases
- Feature-based branching strategy

---

## License

This project is developed for academic and demonstration purposes. It showcases enterprise frontend architecture, role-based access control, multi-tenancy, and automation-ready design using a fixed backend API.
