# Database Scripts

This directory contains the essential database setup scripts for Inspect360 HSE.

## Scripts Overview

### 1. `database-setup.sql`
- **Purpose**: Complete database schema setup
- **When to use**: Run this ONCE when setting up a new Supabase project
- **What it does**:
  - Creates all tables (user_profiles, templates, inspections, etc.)
  - Sets up initial RLS policies
  - Creates necessary functions and triggers
  - Sets up the basic database structure

### 2. `fix-admin-profile.sql`
- **Purpose**: Admin setup and secure RLS policies
- **When to use**: Run this after database-setup.sql or when fixing admin access issues
- **What it does**:
  - Creates/updates admin user profile for admin@ocp.com
  - Implements secure Row Level Security policies
  - Sets up role-based access controls
  - Ensures admin/manager can access user management features

## Setup Instructions

1. **First time setup**: Run `database-setup.sql` in your Supabase SQL Editor
2. **Admin setup**: Run `fix-admin-profile.sql` in your Supabase SQL Editor
3. **Done**: Your database is ready for the Inspect360 HSE application

## Important Notes

- Always run these scripts in a Supabase SQL Editor, not through the application
- Make sure you have the correct Supabase project URL and keys configured
- The admin user (admin@ocp.com) will be created automatically
- RLS policies ensure proper role-based access control

## Recent Improvements

### Enhanced Date/Time Pickers
- **Mobile**: Native date/time pickers with intuitive spinner/calendar interface
- **Web**: HTML5 date/time inputs for optimal browser compatibility
- **Features**: 
  - Touch-friendly date selection
  - Time picker with hour/minute precision
  - Automatic format validation
  - Cross-platform consistent behavior
