# CloudCast - Real-time Messaging Application

## Overview

CloudCast is a room-based real-time messaging web application with a neo-brutalist design inspired by WhatsApp's interface patterns. Built with Node.js, Express, and WebSocket technology, it enables users to create and join chat rooms for organized messaging experiences. The application features a modern brutalist aesthetic using the Satoshi font family, with high-contrast colors and sharp geometric elements.

The project implements a clean separation between frontend vanilla technologies (HTML/CSS/JavaScript) and a robust Express.js backend with WebSocket real-time communication. Users can create custom chat rooms, join existing ones, and exchange messages in real-time with WhatsApp-style message bubbles and smooth animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a **focused single-frontend approach** optimized for real-time messaging:

- **Primary Interface**: Vanilla HTML, CSS, and JavaScript served from the `/public` directory with WhatsApp-inspired room-based chat layout
- **Typography**: Satoshi font for modern brutalist headings and UI elements, IBM Plex Mono for technical elements and usernames
- **Design System**: Neo-brutalist aesthetic with bright blue (#0066FF) accents, yellow (#FFFF00) highlights, flat colors, hard edges, and rectangular message bubbles aligned left/right based on sender
- **Layout**: Sidebar room list with main chat area, fully responsive design that adapts to mobile with modal room selection

### Backend Architecture
The server uses **Express.js with WebSocket integration** for room-based real-time communication:

- **HTTP Server**: Express.js handling static file serving and REST API endpoints for room management
- **WebSocket Layer**: Custom WebSocket server on `/ws` path using the `ws` library for room-based messaging
- **Room Management**: Users can create rooms, join specific rooms, and messages are broadcasted only to users in the same room
- **Message Broadcasting**: Real-time message distribution to room participants with room-specific message history
- **API Endpoints**: RESTful routes for room creation, room listing, and room-specific message retrieval

### Data Storage Solutions
The application implements **flexible room-based storage architecture**:

- **Current Implementation**: In-memory storage using Map-based data structures for users, rooms, and messages
- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions for users, rooms, and messages tables with room relationships
- **Room Data Model**: Each room has unique ID, name, and creation timestamp; messages are linked to specific rooms
- **Migration Ready**: Database configuration prepared for PostgreSQL deployment with Neon Database integration
- **Data Models**: Type-safe schemas with Zod validation for user, room, and message data structures

### Authentication and Authorization
The system uses **simplified session management**:

- **User Identification**: Auto-generated usernames for immediate access without registration barriers
- **Session Handling**: Basic session support infrastructure with connect-pg-simple for future PostgreSQL session storage
- **Connection Tracking**: Real-time user count and connection status monitoring

## External Dependencies

### Real-time Communication
- **WebSocket Server**: `ws` library for WebSocket connections and message broadcasting
- **HTTP Framework**: Express.js for REST API endpoints and static file serving

### Database and ORM
- **Database**: Neon Database (PostgreSQL) for production data persistence
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Validation**: Zod for runtime type checking and data validation

### Frontend Libraries
- **React Ecosystem**: React, React DOM, and Wouter for routing in the secondary frontend
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS for utility-first styling and class-variance-authority for component variants
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Hookform Resolvers for form validation

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Code Quality**: TypeScript for static type checking and better developer experience
- **Linting**: ESBuild for fast JavaScript bundling and compilation
- **Development**: Replit-specific plugins for runtime error overlay and cartographer integration

### Utility Libraries
- **Styling Utilities**: clsx and tailwind-merge for conditional CSS classes
- **Date Handling**: date-fns for date manipulation and formatting
- **Icons**: Lucide React for consistent iconography
- **UI Enhancements**: Various utility libraries for enhanced user interface components