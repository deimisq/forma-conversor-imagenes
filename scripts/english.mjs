import { spawnSync } from 'node:child_process'

const action = process.argv[2] ?? 'build:app'
if (!['dev', 'build:app'].includes(action)) throw new Error('Unknown build action')
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', action], {
  stdio: 'inherit',
  env: { ...process.env, APP_LANGUAGE: 'en' },
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
