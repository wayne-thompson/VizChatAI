# VizChat Project Documentation

## Overview
VizChat is a web application that enables users to upload images of data visualizations (charts, graphs, dashboards) and interact with them through AI. The core functionality allows users to receive AI-generated insights about their visualizations and chat with an AI assistant named "Data Vizard" about the data.

## Recent Changes
- **October 2, 2025**: Removed Generate Insights button - insights now automatically generated during upload
- **October 2, 2025**: Added Account page with user profile and logout functionality
- **October 2, 2025**: Reorganized header navigation - moved user info and logout to dedicated Account page
- **October 2, 2025**: Removed Interactive Chat section from share options, added Share button near Save Report
- **June 25, 2025**: Updated to white background logo version for better visibility on headers and navigation
- **June 25, 2025**: Integrated new custom logo throughout the application (navigation, footer, mobile header)
- **June 25, 2025**: Removed pricing section and "Watch Demo" button from landing page per user request
- **June 25, 2025**: Added welcome message and refresh prompt for users who complete authentication on landing page
- **June 25, 2025**: Fixed Replit Auth "Back to my app" button to redirect to landing page for unauthenticated users
- **June 25, 2025**: Created professional SaaS landing page with hero section, features, pricing, and CTAs
- **June 25, 2025**: Successfully implemented Replit authentication system with secure user login
- **June 25, 2025**: Fixed authentication cookie handling and frontend credential management
- **June 25, 2025**: Implemented multi-visualization upload feature for comprehensive business insights
- **June 25, 2025**: Fixed bullet point formatting issues in AI-generated summaries
- **June 25, 2025**: Added Save Report functionality to archive reports and return to homepage

## Project Architecture

### Authentication
- Uses Replit OpenID Connect for secure authentication
- Session management with PostgreSQL storage
- Protected routes requiring user authentication
- User profiles with email, name, and profile image

### Database Schema
- **users**: Stores user information from Replit Auth (id, email, firstName, lastName, profileImageUrl)
- **sessions**: Manages user sessions for authentication
- **visualizations**: Stores uploaded charts and AI analysis results
- **messages**: Chat history between users and Data Vizard

### Core Features
- Single and multi-visualization upload
- AI-powered analysis using OpenAI GPT-4o
- Interactive chat with Data Vizard about visualizations
- Report archiving and sharing capabilities (via Share button)
- Comprehensive business insights for multiple charts
- Account page for user profile management and logout

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Wouter routing
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OpenID Connect with Passport.js
- **AI**: OpenAI GPT-4o for image analysis and chat

## User Preferences
- Clean, professional UI without excessive technical jargon
- SaaS application with professional landing page including hero section and features (no pricing section for now)
- Bullet points should display actual content, not object references
- Multi-visualization projects should show stacked layout with single title
- Save functionality should archive and return to homepage for fresh uploads

## Key Implementation Notes
- All API routes are protected with authentication middleware
- User IDs are strings (Replit Auth format) not integers
- OpenAI responses require careful parsing to handle object-formatted bullet points
- Database foreign keys updated to support varchar user IDs
- Landing page shown for unauthenticated users, authenticated users see main app