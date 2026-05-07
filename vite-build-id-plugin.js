import { writeFileSync } from 'fs'
import { createHash } from 'crypto'

/**
 * Vite-plugin: generoi build.json tiedoston dist/-hakemistoon.
 * Sisältää uniikin buildId:n + aikaleiman.
 * App-puolen pollauslogiikka vertaa tätä localStorageen tallennettuun
 * edellisen buildin ID:hen ja näyttää päivitysilmoituksen.
 */
export default function generateBuildId() {
  return {
    name: 'generate-build-id',
    closeBundle() {
      const timestamp = new Date().toISOString()
      const hash = createHash('sha256')
        .update(timestamp + Math.random().toString())
        .digest('hex')
        .slice(0, 8)

      const buildJson = {
        buildId: `${timestamp.slice(0, 10)}-${hash}`,
        timestamp,
      }

      writeFileSync('dist/build.json', JSON.stringify(buildJson))
      console.log(`[build] build.json generated: ${buildJson.buildId}`)
    },
  }
}
