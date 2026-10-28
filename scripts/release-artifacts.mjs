import path from 'node:path'

export function releaseArtifacts(version, root = path.resolve('release', version)) {
  return ['es', 'en'].flatMap((language) => ['.exe', '.appx'].map((ext) => {
    const prefix = language === 'en' ? 'forma-setup-en' : 'forma-setup'
    const versionedKey = `${prefix}-${version}${ext}`
    return {
      filePath: path.join(root, ...(language === 'en' ? ['en'] : []), versionedKey),
      ext,
      versionedKey,
      latestKey: `${prefix}-latest${ext}`,
    }
  }))
}
