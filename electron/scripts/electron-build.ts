// electron/scripts/electron-build.ts
import { type ChildProcess, spawn } from 'node:child_process'
import chalk from 'chalk'

import { paths } from './paths'
import { catchExit, rmRf, spacedLog, usingSetValue, waitProcess } from './utils'

const tag = chalk.magenta('[electron-build]')

const childProcesses = new Set<ChildProcess>()

async function main() {
  catchExit(() => {
    console.log(tag, 'Cleaning up...')
    for (const child of childProcesses) {
      child.kill('SIGTERM')
    }
  })

  await rmRf(paths.dist)
  {
    spacedLog(tag, '(1/4)', 'Build web code')
    const child = spawn('vite', ['build', '--config', paths.viteConfig], { stdio: 'inherit' })
    await usingSetValue(childProcesses, child, waitProcess)
  }
  {
    spacedLog(tag, '(2/4)', 'Build main code')
    const child = spawn('vite', ['build', '--config', paths.viteConfigMain], { stdio: 'inherit' })
    await usingSetValue(childProcesses, child, waitProcess)
  }
  {
    spacedLog(tag, '(3/4)', 'Build preload code')
    const child = spawn('vite', ['build', '--config', paths.viteConfigPreload], { stdio: 'inherit' })
    await usingSetValue(childProcesses, child, waitProcess)
  }
  {
    spacedLog(tag, '(4/4)', 'Build electron app')
    await rmRf(paths.release)

    const child = spawn('electron-builder', ['--config', paths.electronBuilderConfig], { stdio: 'inherit' })
    await usingSetValue(childProcesses, child, waitProcess)
  }
}

void main()
