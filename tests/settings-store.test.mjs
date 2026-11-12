import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createSettingsStore } from '../electron/settings-store.ts'
import { defaultSettings } from '../shared/advanced-settings.ts'
import { toolMessage } from '../shared/tool-errors.ts'

async function storeFile(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forma-ajustes-'))
  t.after(() => fs.rm(dir, { recursive: true, force: true }))
  return path.join(dir, 'configuracion.json')
}

test('recupera preferencias y ajustes tras reiniciar y permite actualizarlos y eliminarlos', async t => {
  const file = await storeFile(t)
  const store = createSettingsStore(file)
  const settings = { ...defaultSettings(), preserveFolders: true }
  const [saved] = await Promise.all([
    store.savePreset({ name: 'Catálogo', settings }),
    store.savePreferences({ ...settings, outputDirectory: path.dirname(file) }),
  ])
  const id = saved.presets[0].id
  const restarted = createSettingsStore(file)
  const loaded = await restarted.load()
  assert.equal(loaded.preferences.outputDirectory, path.dirname(file))
  assert.equal(loaded.presets[0].settings.preserveFolders, true)
  await restarted.savePreset({ id, name: 'Catálogo actualizado', settings: { ...settings, quality: 70 } })
  assert.equal((await restarted.load()).presets[0].settings.quality, 70)
  await assert.rejects(restarted.savePreset({ name: 'CATÁLOGO ACTUALIZADO', settings }), /Ya existe/)
  await restarted.deletePreset(id)
  assert.deepEqual((await createSettingsStore(file).load()).presets, [])
})

test('una configuración dañada se conserva y no se sobrescribe al intentar guardar', async t => {
  const file = await storeFile(t)
  await fs.writeFile(file, '{archivo dañado')
  const store = createSettingsStore(file)
  await assert.rejects(store.load(), /Se conserva/)
  await assert.rejects(store.savePreferences({ ...defaultSettings(), outputDirectory: '' }), /Se conserva/)
  assert.equal(await fs.readFile(file, 'utf8'), '{archivo dañado')
})

test('los errores de IPC se presentan en español sin prefijos internos', () => {
  assert.equal(toolMessage(new Error("Error invoking remote method 'settings:save-preset': Error: Ya existe un ajuste con ese nombre."), 'es'), 'Ya existe un ajuste con ese nombre.')
  assert.equal(toolMessage(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }), 'es'), 'No se encontró el archivo o la carpeta.')
})
