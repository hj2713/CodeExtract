# Team Collaboration Guide 🚀

## Quick Start for Your Partner

When your partner clones this repo, they should:

```bash
# 1. Install dependencies
bun install

# 2. Apply database schema
bun run db:push

# 3. Run the development server
bun run dev
```

**That's it!** No Docker needed with SQLite! 🎉

---

## Your Workspace Pages

### Himanshu's Page
- **URL:** http://localhost:3001/himanshu
- **File:** `apps/web/src/app/himanshu/page.tsx`
- **What to do:** Build your features here without touching partner's files

### Partner's Page
- **URL:** http://localhost:3001/partner
- **File:** `apps/web/src/app/partner/page.tsx`
- **What to do:** Your partner builds their features here

---

## Why Separate Pages?

✅ **No Git Conflicts** - You edit different files  
✅ **Independent Work** - Build features without waiting  
✅ **Easy Testing** - Each person tests their own page  
✅ **Clear Ownership** - Everyone knows what they're responsible for

---

## SQLite Database (No Docker! 🎉)

### What's Different from PostgreSQL?

**SQLite is simpler:**
- ✅ No Docker installation needed
- ✅ No containers to start/stop
- ✅ Database is just a file in your project
- ✅ Perfect for development and small projects

### Database Location

Your database file is stored at:
```
packages/db/sqlite.db
```

This file is **NOT pushed to Git** (it's in .gitignore). Each team member has their own local database file.

### Database Commands

```bash
# Apply schema changes to your local database
bun run db:push

# View database in browser UI
bun run db:studio

# Generate migration files
bun run db:generate

# Apply migrations
bun run db:migrate
```

---

## Development Workflow

### Daily Workflow:
1. `bun run dev` - Start development server
2. Open your page: http://localhost:3001/himanshu or /partner
3. Code your features
4. Test your changes
5. Commit and push to git

### Before Pushing to Git:
```bash
# Format and lint your code
bun run check

# Add your changes
git add .

# Commit with a clear message
git commit -m "Add feature X to himanshu page"

# Push to GitHub
git push
```

---

## What Gets Pushed to Cloud?

✅ **Your code files** (.tsx, .ts)  
✅ **Configuration files**  
✅ **Database schema** (structure)  

❌ **NOT pushed:**
- `node_modules/` (too big, everyone installs their own)
- `.env` files (contains secrets)
- `sqlite.db` (database file - everyone has their own)
- PDF/doc files (excluded in .gitignore)

---

## Useful Commands

```bash
# Development
bun run dev              # Start all apps
bun run dev:web          # Start only web app

# Database
bun run db:push          # Apply schema changes
bun run db:studio        # Open database UI
bun run db:generate      # Generate migrations
bun run db:migrate       # Apply migrations

# Code Quality
bun run check            # Format and lint
bun run check-types      # Check TypeScript errors

# Build
bun run build            # Build for production
```

---

## Project Structure

```
my-better-t-app/
├── apps/
│   └── web/                    # Your Next.js frontend
│       └── src/app/
│           ├── himanshu/       # 👈 Your page
│           ├── partner/        # 👈 Partner's page
│           └── ai/             # AI example page
├── packages/
│   ├── db/                     # Database & Drizzle ORM
│   │   └── sqlite.db          # ❌ NOT pushed (local only)
│   ├── env/                    # Environment config
│   └── config/                 # Shared configs
└── .gitignore                  # What NOT to push
```

---

## SQLite vs PostgreSQL - Quick Comparison

| Feature | SQLite (Current) | PostgreSQL (Previous) |
|---------|------------------|----------------------|
| Setup | ✅ Zero setup | ❌ Docker needed |
| Installation | ✅ Built-in | ❌ Container required |
| Start Time | ✅ Instant | ❌ ~10 seconds |
| File | ✅ Single .db file | ❌ Container data |
| Perfect For | ✅ Development, small apps | ❌ Production, large apps |

**For this hackathon, SQLite is perfect!** 🎯

---

## Troubleshooting

### Database errors?
```bash
# Delete the database and recreate it
rm packages/db/sqlite.db
bun run db:push
```

### Port already in use?
Someone else might be using port 3001. Stop other apps first.

### Git conflicts?
If you both edited different files, there should be no conflicts!  
If conflicts happen, ask for help merging.

---

## Team Coordination Tips

1. **Communicate what you're working on** - "I'm building the upload form on my page"
2. **Commit frequently** - Small commits are easier to manage
3. **Pull before you start** - `git pull` to get latest changes
4. **Test before pushing** - Make sure your code works
5. **Write clear commit messages** - "Fix button styling" not "updates"

---

## Need Help?

- Next.js docs: https://nextjs.org/docs
- Drizzle docs: https://orm.drizzle.team/docs/overview
- SQLite docs: https://www.sqlite.org/docs.html
- Better-T-Stack: https://github.com/AmanVarshney01/create-better-t-stack

---

## Quick Comparison: What Changed?

### Old Setup (PostgreSQL):
```bash
bun run db:start   # Start Docker container
bun run db:push    # Apply schema
bun run dev        # Run server
```

### New Setup (SQLite):
```bash
bun run db:push    # Apply schema (no Docker!)
bun run dev        # Run server
```

**One less step!** 🎉
