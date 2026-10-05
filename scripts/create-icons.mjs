import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'src', 'assets', 'forma-logo.svg')
const pngPath = path.join(root, 'public', 'forma-logo.png')
const icoPath = path.join(root, 'assets', 'forma-logo.ico')

await fs.mkdir(path.dirname(pngPath), { recursive: true })
await fs.mkdir(path.dirname(icoPath), { recursive: true })
await sharp(source).resize(256, 256).png().toFile(pngPath)
await fs.writeFile(icoPath, await pngToIco(pngPath))