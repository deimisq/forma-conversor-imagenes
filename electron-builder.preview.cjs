// Local test package only. Never use this configuration for Store submissions.
const fs = require('node:fs')
const base = JSON.parse(fs.readFileSync(require('node:path').join(__dirname, 'electron-builder.json5'), 'utf8'))
module.exports = {
  ...base,
  appId: 'com.forma.imageconverter.preview',
  productName: 'Forma Preview',
  extraMetadata: { name: 'forma-preview', productName: 'Forma Preview', version: '2.0.0-preview.1', description: 'Forma 2.0 · Prueba local de herramientas gratuitas' },
  publish: null,
  directories: { ...base.directories, output: 'release/preview' },
  win: { ...base.win, executableName: 'FormaPreview', target: [{ target: 'appx', arch: ['x64'] }], artifactName: 'forma-preview-2.0.0.appx' },
  appx: { ...base.appx, applicationId: 'FormaPreview', identityName: 'DeimisQuintanilla.FormaPreview', displayName: 'Forma Preview' },
}
