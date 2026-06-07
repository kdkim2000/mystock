import { test as setup } from '@playwright/test'
import { injectAuthCookie } from './fixtures/auth'
import * as fs from 'fs'
import * as path from 'path'

const authFile = 'tests/.auth/user.json'

setup('authenticate', async ({ browser }) => {
  const context = await browser.newContext()
  await injectAuthCookie(context)

  const dir = path.dirname(authFile)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  await context.storageState({ path: authFile })
  await context.close()
})
