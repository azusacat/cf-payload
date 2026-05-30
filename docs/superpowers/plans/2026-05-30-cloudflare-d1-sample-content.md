# Cloudflare D1 sample content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Schools/Missions collections and seed sample data on first run in the Cloudflare D1 template while extending Users with profile and role fields.

**Architecture:** Define two new collection configs and extend the Users collection with additional fields. Add a seed helper that checks counts for Users/Schools/Missions on startup and seeds a minimal data set only when all are empty. Wire the seed helper into the template’s `onInit` hook and keep admin UI defaults.

**Tech Stack:** Payload CMS (TypeScript), Cloudflare D1 adapter, Payload collection configs, Payload `onInit` hook.

---

## File Structure

- Create: `templates/with-cloudflare-d1/src/collections/Schools.ts` — Schools collection schema.
- Create: `templates/with-cloudflare-d1/src/collections/Missions.ts` — Missions collection schema with relationships.
- Create: `templates/with-cloudflare-d1/src/seed.ts` — onInit seed helper.
- Modify: `templates/with-cloudflare-d1/src/collections/Users.ts` — add profile + role fields.
- Modify: `templates/with-cloudflare-d1/src/payload.config.ts` — register collections + seed hook.
- Modify: `templates/with-cloudflare-d1/README.md` — document new collections and seeding.

---

### Task 1: Add Schools collection

**Files:**

- Create: `templates/with-cloudflare-d1/src/collections/Schools.ts`

- [ ] **Step 1: Create Schools collection config**

```ts
import type { CollectionConfig } from 'payload'

export const Schools: CollectionConfig = {
  slug: 'schools',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'remarks',
      type: 'textarea',
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add templates/with-cloudflare-d1/src/collections/Schools.ts
git commit -m "feat: add schools collection to d1 template"
```

---

### Task 2: Add Missions collection

**Files:**

- Create: `templates/with-cloudflare-d1/src/collections/Missions.ts`

- [ ] **Step 1: Create Missions collection config with relationships**

```ts
import type { CollectionConfig } from 'payload'

export const Missions: CollectionConfig = {
  slug: 'missions',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'remarks',
      type: 'textarea',
    },
    {
      name: 'school',
      type: 'relationship',
      relationTo: 'schools',
      required: true,
    },
    {
      name: 'teacher',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: {
        role: {
          equals: 'Teacher',
        },
      },
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add templates/with-cloudflare-d1/src/collections/Missions.ts
git commit -m "feat: add missions collection to d1 template"
```

---

### Task 3: Extend Users collection fields

**Files:**

- Modify: `templates/with-cloudflare-d1/src/collections/Users.ts`

- [ ] **Step 1: Replace the fields array with profile and role fields**

```ts
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        {
          label: 'Zero2 admin',
          value: 'Zero2 admin',
        },
        {
          label: 'Zero2 Staff',
          value: 'Zero2 Staff',
        },
        {
          label: 'Teacher',
          value: 'Teacher',
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
  ],
```

- [ ] **Step 2: Commit**

```bash
git add templates/with-cloudflare-d1/src/collections/Users.ts
git commit -m "feat: extend users fields in d1 template"
```

---

### Task 4: Add startup seed helper

**Files:**

- Create: `templates/with-cloudflare-d1/src/seed.ts`

- [ ] **Step 1: Create seed helper that checks counts and seeds sample data**

```ts
import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  const [
    { totalDocs: schoolsCount },
    { totalDocs: missionsCount },
    { totalDocs: usersCount },
  ] = await Promise.all([
    payload.count({ collection: 'schools' }),
    payload.count({ collection: 'missions' }),
    payload.count({ collection: 'users' }),
  ])

  if (schoolsCount > 0 || missionsCount > 0 || usersCount > 0) {
    return
  }

  payload.logger.info('Seeding sample data...')

  const [northSchool, southSchool] = await Promise.all([
    payload.create({
      collection: 'schools',
      data: {
        name: 'Zero2 Academy',
        remarks: 'Sample campus for pilot programs.',
      },
    }),
    payload.create({
      collection: 'schools',
      data: {
        name: 'Payload High',
        remarks: 'STEM-focused partner school.',
      },
    }),
  ])

  const teacher = await payload.create({
    collection: 'users',
    data: {
      email: 'teacher@zero2.edu',
      password: 'password',
      name: 'Taylor Teacher',
      role: 'Teacher',
      title: 'Science Teacher',
      phone: '555-0101',
    },
  })

  await payload.create({
    collection: 'users',
    data: {
      email: 'staff@zero2.edu',
      password: 'password',
      name: 'Sam Staff',
      role: 'Zero2 Staff',
      title: 'Program Coordinator',
      phone: '555-0102',
    },
  })

  await payload.create({
    collection: 'missions',
    data: {
      name: 'STEM Outreach',
      remarks: 'Intro mission for new students.',
      school: northSchool.id,
      teacher: teacher.id,
    },
  })

  await payload.create({
    collection: 'missions',
    data: {
      name: 'Robotics Challenge',
      remarks: 'Advanced mission for project teams.',
      school: southSchool.id,
      teacher: teacher.id,
    },
  })

  payload.logger.info('Sample data seeded.')
}
```

- [ ] **Step 2: Commit**

```bash
git add templates/with-cloudflare-d1/src/seed.ts
git commit -m "feat: add d1 template seed helper"
```

---

### Task 5: Wire collections and seed hook into Payload config

**Files:**

- Modify: `templates/with-cloudflare-d1/src/payload.config.ts`

- [ ] **Step 1: Add imports for new collections and seed helper**

```ts
import { Missions } from './collections/Missions'
import { Schools } from './collections/Schools'
import { seed } from './seed'
```

- [ ] **Step 2: Register collections and add onInit seed hook**

```ts
  collections: [Users, Media, Schools, Missions],
  editor: lexicalEditor(),
  onInit: async (payload) => {
    await seed(payload)
  },
```

- [ ] **Step 3: Commit**

```bash
git add templates/with-cloudflare-d1/src/payload.config.ts
git commit -m "feat: wire d1 template collections and seed hook"
```

---

### Task 6: Update Cloudflare D1 template documentation

**Files:**

- Modify: `templates/with-cloudflare-d1/README.md`

- [ ] **Step 1: Update Collections section and note first-run seeding**

```md
- #### Schools

  A simple collection representing partner schools.

- #### Missions

  Missions are linked to a School and a Teacher user.

### Sample data

On first run, the template seeds sample Schools, Users, and Missions when those collections are empty.
```

- [ ] **Step 2: Commit**

```bash
git add templates/with-cloudflare-d1/README.md
git commit -m "docs: document d1 template sample content"
```

---

### Task 7: Run validation commands

**Files:**

- No code changes.

- [ ] **Step 1: Run lint**

```bash
pnpm run lint
```

Expected: completes successfully.

- [ ] **Step 2: Run core build**

```bash
pnpm run build:core
```

Expected: completes successfully.

- [ ] **Step 3: Run tests**

```bash
pnpm run test
```

Expected: fails because MongoDB is not reachable at `localhost:27018` (same baseline failure).

- [ ] **Step 4: Commit (no-op)**

```bash
git status --short
```

Expected: no changes.
