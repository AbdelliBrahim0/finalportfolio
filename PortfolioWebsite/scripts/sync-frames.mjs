import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = path.dirname(fileURLToPath(import.meta.url))
const sourceDirectory = path.resolve(projectDirectory, '..', '..', 'ezgif-2b3b4f7f49916a82-jpg')
const targetDirectory = path.resolve(projectDirectory, '..', 'public', 'frames')

await mkdir(targetDirectory, { recursive: true })
const existingFiles = await readdir(targetDirectory)
await Promise.all(
  existingFiles
    .filter((file) => file.endsWith('.jpg'))
    .map((file) => rm(path.join(targetDirectory, file))),
)
await cp(sourceDirectory, targetDirectory, {
  recursive: true,
  force: true,
})

const frameCount = (await readdir(sourceDirectory)).filter((file) => file.endsWith('.jpg')).length
await writeFile(
  path.join(targetDirectory, 'manifest.json'),
  JSON.stringify({ frameCount }),
)

console.log(`Synchronized ${frameCount} animation frames from ${sourceDirectory}`)
