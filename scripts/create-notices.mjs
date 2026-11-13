import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'))
const records = []
const sections = ['Forma · Third-party notices / Avisos de terceros',
  'Generated from the installed production dependency tree and package-lock.json.',
  'Electron and Chromium notices are also distributed beside the application executable.',
  'This inventory includes dependencies bundled into JavaScript and installed optional packages; some may not be used on this platform.\n']
for (const [location, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!location || entry.dev) continue
  const directory = path.join(root, location)
  let metadata
  try { metadata = JSON.parse(await fs.readFile(path.join(directory, 'package.json'), 'utf8')) }
  catch (error) { if (entry.optional && error.code === 'ENOENT') continue; throw error }
  if (metadata.version !== entry.version) throw new Error(`Dependency version mismatch: ${location}`)
  const names = (await fs.readdir(directory)).filter(name => /^(licen[cs]e|copying|notice|third[-_]party[-_]notices)([._-]|$)/i.test(name))
  const texts = []
  for (const name of names.sort()) {
    if (!(await fs.stat(path.join(directory, name))).isFile()) continue
    texts.push({ file: name, text: await fs.readFile(path.join(directory, name), 'utf8') })
  }
  if (metadata.name.startsWith('@napi-rs/canvas-') && !texts.length) {
    texts.push({ file: '@napi-rs/canvas/LICENSE', text: await fs.readFile(path.join(root, 'node_modules/@napi-rs/canvas/LICENSE'), 'utf8') })
    texts.push({ file: 'sbom.cdx.json', text: await fs.readFile(path.join(directory, 'sbom.cdx.json'), 'utf8') })
  }
  if (metadata.name === 'fontkit' && metadata.version === '2.0.4' && !texts.length) {
    texts.push({ file: 'fontkit/LICENSE (upstream)', text: await fs.readFile(path.join(root, 'licenses/upstream/fontkit-2.0.4-LICENSE.txt'), 'utf8') })
  }
  // These exact versions declare MIT but ship no license text; keep a review flag.
  // Preserve its declaration and author without inventing a copyright notice.
  const missingUpstreamText = ((metadata.name === 'lazy-val' && metadata.version === '1.0.5') || (metadata.name === 'brotli' && metadata.version === '1.3.3') || (metadata.name === 'dfa' && metadata.version === '1.2.0')) && !texts.length
  if (!texts.length && !missingUpstreamText) throw new Error(`Missing license text: ${location}`)
  if (missingUpstreamText) console.warn(`License review pending: ${metadata.name} ${metadata.version} has no packaged license text.`)
  // The native sharp package's README contains its libvips dependency attributions.
  if (metadata.name.startsWith('@img/sharp-')) {
    texts.push({ file: 'README.md', text: await fs.readFile(path.join(directory, 'README.md'), 'utf8') })
  }
  // png-js 2.0.0 omits the manifest field but includes the full MIT LICENSE.
  const record = { name: metadata.name, version: metadata.version, license: metadata.license ?? metadata.licenses?.map(item => item.type).join(' OR ') ?? (metadata.name === 'png-js' && metadata.version === '2.0.0' && texts.some(item => item.text.startsWith('MIT License')) ? 'MIT' : undefined),
    repository: metadata.repository, author: metadata.author, location, licenseFiles: texts.map(item => item.file),
    ...(missingUpstreamText ? { reviewRequired: 'Upstream declares MIT but supplies no license text.' } : {}) }
  if (!record.license) throw new Error(`Missing license declaration: ${location}`)
  records.push(record)
  sections.push(`\n${'='.repeat(72)}\n${record.name} ${record.version}\nLicense: ${record.license}\n${location}`)
  if (missingUpstreamText) sections.push(`Author: ${metadata.author}\nRepository: ${typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url}\nReview pending: upstream declares MIT but supplies no license text.`)
  for (const item of texts) sections.push(`\n--- ${item.file} ---\n${item.text}`)
}
const output = path.join(root, 'generated', 'notices')
await fs.mkdir(output, { recursive: true })
await fs.writeFile(path.join(output, 'THIRD-PARTY-NOTICES.txt'), sections.join('\n'))
await fs.writeFile(path.join(output, 'dependencies.json'), JSON.stringify(records, null, 2) + '\n')
const nativeVersions = JSON.parse(await fs.readFile(path.join(root, 'node_modules/@img/sharp-win32-x64/versions.json'), 'utf8'))
await fs.writeFile(path.join(output, 'native-library-versions.json'), JSON.stringify(nativeVersions, null, 2) + '\n')
console.log(`Generated notices for ${records.length} installed production packages.`)
