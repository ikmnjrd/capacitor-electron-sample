// electron/scripts/electron-dev.ts
import { type ChildProcess, spawn } from 'node:child_process'
import chalk from 'chalk'
import chokidar, { type FSWatcher } from 'chokidar'
import supportsColor from 'supports-color'

import { paths } from './paths'
import { catchExit, spacedLog, tagStdio, waitProcessStdout } from './utils'

const FORCE_COLOR = supportsColor.stdout !== false ? '1' : '0'

const tag = chalk.magenta('[electron-dev]')

const tagWebDev = chalk.blue('[web-dev]')
const tagElectronBuildMain = chalk.blue('[electron-build-main]')
const tagElectronBuildPreload = chalk.blue('[electron-build-preload]')

const tagElectron = chalk.green('[electron]')

let viteDevServerUrl: string | null = null

const viteLocalDevServerRegExp = /Local:\s+(https?:\/\/localhost:\d+\/)/
const viteBuildWatchRegExp = /built in/g

// resources
const childProcesses = new Set<ChildProcess>()
const electronProcesses = new Set<ChildProcess>()
let watcher: FSWatcher | null = null

// MARK: refresh
function refresh() {
  if (viteDevServerUrl === null) {
    throw new Error('Vite dev server URL is not set')
  }

  for (const child of electronProcesses) {
    child.kill('SIGTERM')
  }
  electronProcesses.clear()

  const child = spawn('electron', [paths.distMain], {
    env: { ...process.env, FORCE_COLOR, VITE_DEV_SERVER_URL: viteDevServerUrl },
  })
  tagStdio(child, tagElectron)
  electronProcesses.add(child)

  child.on('exit', code => {
    electronProcesses.delete(child)
    console.log(tag, 'Process', child.pid, 'exited with code', code)

    if (electronProcesses.size === 0) {
      console.log(tag, 'All processes exited. Exiting...')
      process.exit(0)
    }
  })

  child.on('error', err => {
    console.error(tag, 'Error in', child.pid, ':', err)
  })

  console.log(tag, 'Process', child.pid, 'started')
}

// MARK: debouncedRefresh
let refreshTimeout: NodeJS.Timeout | null = null
function debouncedRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }
  refreshTimeout = setTimeout(() => {
    refresh()
  }, 300)
}

// MARK: main
async function main() {
  catchExit(async () => {
    console.log(tag, 'Cleaning up...')
    for (const child of childProcesses) {
      child.kill('SIGTERM')
    }
    for (const child of electronProcesses) {
      child.kill('SIGTERM')
    }
    await watcher?.close()
  })

  {
    spacedLog(tag, '(1/4)', 'Starting web dev server')
    const child = spawn('vite', ['--config', paths.viteConfig], {
      env: { ...process.env, FORCE_COLOR },
    })
    childProcesses.add(child)
    tagStdio(child, tagWebDev)
    const data = await waitProcessStdout(child, viteLocalDevServerRegExp)

    const match = viteLocalDevServerRegExp.exec(data)
    if (match && match.length > 1) {
      viteDevServerUrl = match[1]
    } else {
      throw new Error('Failed to start web dev server')
    }
  }
  {
    spacedLog(tag, '(2/4)', 'Starting electron main build watch')
    const child = spawn('vite', ['build', '--watch', '--config', paths.viteConfigMain], {
      env: { ...process.env, FORCE_COLOR },
    })
    childProcesses.add(child)
    tagStdio(child, tagElectronBuildMain)
    await waitProcessStdout(child, viteBuildWatchRegExp)
  }
  {
    spacedLog(tag, '(3/4)', 'Starting electron preload build watch')
    const child = spawn('vite', ['build', '--watch', '--config', paths.viteConfigPreload], {
      env: { ...process.env, FORCE_COLOR },
    })
    childProcesses.add(child)
    tagStdio(child, tagElectronBuildPreload)
    await waitProcessStdout(child, viteBuildWatchRegExp)
  }
  spacedLog(tag, '(4/4) Starting Electron watcher')
  watcher = chokidar.watch([paths.dist], { ignoreInitial: true })

  watcher.on('change', path => {
    console.log(tag, `File changed: ${path}. Restarting Electron...`)
    debouncedRefresh()
  })

  debouncedRefresh()
}

void main()
