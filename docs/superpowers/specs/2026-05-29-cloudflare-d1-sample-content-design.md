# Cloudflare D1 template sample content design

## Summary
Add three collections (Schools, Missions, Users updates) to the Cloudflare D1 template and seed sample data automatically on first run. Keep existing auth behavior while extending Users with new profile fields and role selection.

## Goals
- Add Schools and Missions collections with the requested fields and relationships.
- Extend Users with name, role, title, and phone fields while preserving auth.
- Automatically seed a small set of sample Schools, Users (including Teachers), and Missions on first run.

## Non-goals
- Custom admin UI beyond default collection views.
- Custom access control beyond current auth defaults.
- Changes to tests unless existing tests break.

## Data model
All collections use Payload’s default `id` field; no custom ID field is added.

### Users (existing, auth-enabled)
- Keep existing auth fields (email, password).
- Add:
  - `name` (text)
  - `role` (select: "Zero2 admin", "Zero2 Staff", "Teacher")
  - `title` (text)
  - `phone` (text)

### Schools (new)
- `name` (text)
- `remarks` (textarea)

### Missions (new)
- `name` (text)
- `remarks` (textarea)
- `school` (relationship to Schools, required, single)
- `teacher` (relationship to Users, required, filtered to role = "Teacher")

## Seeding & first run behavior
- Use a startup hook that runs on server start to check whether Schools/Missions/Users are empty.
- If empty, create a small set of sample data:
  - At least 1–2 Schools.
  - At least 1 Teacher user (and optionally a Staff/Admin user).
  - At least 1 Mission linked to a School and Teacher.
- Guard the seed with a count check to ensure idempotency.

## Admin UI & access
- Rely on default admin list/edit views for new collections.
- No additional access rules beyond existing auth defaults.

## Testing & validation
- No new tests planned; run existing lint/build/test commands if required by workflow.
