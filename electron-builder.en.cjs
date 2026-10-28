const fs = require('node:fs')
const path = require('node:path')

// Avoid inherited-array concatenation: the English manifest must list English first.
const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'electron-builder.json5'), 'utf8'))
module.exports = {
  ...base,
  productName: 'Forma Image Converter',
  extraMetadata: { description: 'Local batch image converter for Windows' },
  publish: [{ ...base.publish[0], channel: 'en' }],
  directories: { ...base.directories, output: 'release/${version}/en' },
  win: { ...base.win, artifactName: 'forma-setup-en-${version}.${ext}' },
  appx: { ...base.appx, displayName: 'Forma Image Converter', languages: ['en-US', 'es-ES'] },
  nsis: { ...base.nsis, installerLanguages: ['en_US'], language: '1033' },
}
