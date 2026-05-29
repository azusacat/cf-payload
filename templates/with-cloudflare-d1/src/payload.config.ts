import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Schools } from './collections/Schools'
import { Missions } from './collections/Missions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Schools, Missions],
  editor: lexicalEditor(),
  onInit: async (payload) => {
    await seedSampleData({ payload })
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
})

async function seedSampleData({ payload }: { payload: any }): Promise<void> {
  const shouldSeed = await getShouldSeed({ payload })
  if (!shouldSeed) {
    return
  }

  const password = getSeedPassword()

  payload.logger.info('[seed] Seeding sample Schools / Users / Missions...')
  payload.logger.info(
    `[seed] Created user passwords are logged once. Change them immediately in production.`,
  )

  const school1 = await payload.create({
    collection: 'schools',
    data: { name: 'Zero2 Academy', remarks: 'Sample school' },
    overrideAccess: true,
  })

  const school2 = await payload.create({
    collection: 'schools',
    data: { name: 'North Ridge School', remarks: 'Sample school' },
    overrideAccess: true,
  })

  const teacher = await payload.create({
    collection: 'users',
    data: {
      email: 'teacher@zero2.example',
      password,
      name: 'Pat Teacher',
      role: 'Teacher',
      title: 'Teacher',
      phone: '+1 (555) 010-0001',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'users',
    data: {
      email: 'admin@zero2.example',
      password,
      name: 'Alex Admin',
      role: 'Zero2 admin',
      title: 'Admin',
      phone: '+1 (555) 010-0002',
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'missions',
    data: {
      name: 'Welcome Mission',
      remarks: 'Sample mission',
      school: school1.id,
      teacher: teacher.id,
    },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'missions',
    data: {
      name: 'Second Mission',
      remarks: 'Sample mission',
      school: school2.id,
      teacher: teacher.id,
    },
    overrideAccess: true,
  })

  payload.logger.info({ msg: '[seed] Seed complete', seededUserPassword: password })
}

async function getShouldSeed({ payload }: { payload: any }): Promise<boolean> {
  const [schools, missions, users] = await Promise.all([
    payload.find({ collection: 'schools', limit: 1, overrideAccess: true }),
    payload.find({ collection: 'missions', limit: 1, overrideAccess: true }),
    payload.find({ collection: 'users', limit: 1, overrideAccess: true }),
  ])

  return (
    (schools?.totalDocs ?? 0) === 0 &&
    (missions?.totalDocs ?? 0) === 0 &&
    (users?.totalDocs ?? 0) === 0
  )
}

function getSeedPassword(): string {
  if (process.env.PAYLOAD_SEED_PASSWORD) {
    return process.env.PAYLOAD_SEED_PASSWORD
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'test'
  }

  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) {
    return uuid
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      } satisfies GetPlatformProxyOptions),
  )
}
