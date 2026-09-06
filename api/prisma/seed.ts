// Seeds demo Street Taste accounts: creates real Supabase Auth users via the
// Admin API, then the matching `users` rows Prisma reads from. Run with
// `npm run seed` after `DATABASE_URL` is configured and migrations are applied.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient, Role, Position } from '@prisma/client'

const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in api/.env')
  process.exit(1)
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const prisma = new PrismaClient()

const SEED_ACCOUNTS: Array<{
  email: string
  fullName: string
  role: Role
  position: Position
  hourlyRateCents: number | null
}> = [
  { email: 'manager@streettaste.com', fullName: 'Dana Ortiz', role: Role.MANAGER, position: Position.MANAGER, hourlyRateCents: null },
  { email: 'alex.chen@streettaste.com', fullName: 'Alex Chen', role: Role.STAFF, position: Position.BARTENDER, hourlyRateCents: 1900 },
  { email: 'morgan.lee@streettaste.com', fullName: 'Morgan Lee', role: Role.STAFF, position: Position.SERVER, hourlyRateCents: 1650 },
  { email: 'sam.patel@streettaste.com', fullName: 'Sam Patel', role: Role.STAFF, position: Position.LINE_COOK, hourlyRateCents: 1800 },
]

async function main() {
  for (const account of SEED_ACCOUNTS) {
    const { data: existing } = await admin.auth.admin.listUsers()
    let authId = existing.users.find((u) => u.email === account.email)?.id

    if (!authId) {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        email_confirm: true,
        password: crypto.randomUUID(),
        user_metadata: { full_name: account.fullName, role: account.role },
      })
      if (error || !data.user) {
        console.error(`Failed to create auth user for ${account.email}:`, error?.message)
        continue
      }
      authId = data.user.id

      // Real onboarding should use inviteUserByEmail so the person sets their
      // own password; createUser + a random password is used here only so
      // the seed script is fully non-interactive for local/demo setup.
      await admin.auth.admin.inviteUserByEmail(account.email)
    }

    await prisma.user.upsert({
      where: { id: authId },
      create: {
        id: authId,
        email: account.email,
        fullName: account.fullName,
        role: account.role,
        position: account.position,
        hourlyRateCents: account.hourlyRateCents,
      },
      update: {
        fullName: account.fullName,
        role: account.role,
        position: account.position,
        hourlyRateCents: account.hourlyRateCents,
      },
    })

    console.log(`Seeded ${account.email} -> ${authId}`)
  }

  console.log('\nDone. Invite emails were sent via Supabase Auth for new accounts.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
