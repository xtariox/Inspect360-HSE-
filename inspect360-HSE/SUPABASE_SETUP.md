# Inspect360 HSE - Supabase Setup Guide

## Required Supabase Tables

You need to create the following tables in your Supabase database to support the improved inspection system:

### 1. Execute SQL Commands

Go to your Supabase dashboard → SQL Editor, and run the SQL file: `supabase-tables.sql`

This will create:
- **templates** table: For storing inspection templates
- **inspections** table: For storing completed inspections and drafts
- Proper indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### 2. Table Structure

#### Templates Table
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT  
- category: TEXT
- tags: TEXT[]
- sections: JSONB (stores the form structure)
- created_by: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- is_active: BOOLEAN
- is_prebuilt: BOOLEAN
```

#### Inspections Table
```sql
- id: UUID (Primary Key)
- template_id: UUID (Foreign Key)
- title: TEXT
- location: TEXT
- inspector: TEXT
- date: DATE
- time: TIME
- status: TEXT (draft, in-progress, completed, pending)
- priority: TEXT (low, medium, high, critical)
- responses: JSONB (stores form responses)
- photos: TEXT[]
- score: INTEGER
- issues: INTEGER
- categories: TEXT[]
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- completed_at: TIMESTAMP
```

### 3. Initial Data Setup

The app will automatically initialize prebuilt templates when you first run it. The `TemplatesService.initializePrebuiltTemplates()` function creates:

1. **Safety Inspection Template**
   - General information, safety equipment, machinery, environment, training, final assessment

2. **Maintenance Inspection Template**  
   - Equipment status, preventive maintenance, repairs, documentation

3. **Environmental Compliance Template**
   - Air quality, waste management, water systems, compliance checks

### 4. Features Enabled

With these tables, you now have:

✅ **Template Management**: Create, edit, delete custom templates
✅ **Draft Saving**: Save incomplete inspections and resume later  
✅ **Complete Inspections**: Submit finished inspections with scoring
✅ **Search & Filter**: Find inspections by status, date, location, etc.
✅ **Template Preview**: View template structure before using
✅ **Responsive Design**: Works on mobile, tablet, and desktop

### 5. Environment Variables

Make sure your Supabase configuration is properly set up in `config/supabase.ts`:

```typescript
export const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);
```

### 6. Authentication

The app uses Supabase authentication. Users need to be logged in to:
- Create/manage templates
- Save/submit inspections  
- Access their inspection history

RLS policies ensure users can only see and modify their own data.

## Next Steps

1. Run the SQL commands in Supabase
2. Test the app with a logged-in user
3. Create your first inspection using a prebuilt template
4. Try saving as draft and resuming later
5. Submit a complete inspection

The system is now production-ready with proper data persistence! 🎉
