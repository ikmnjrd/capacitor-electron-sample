import type { ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import stripAnsi from 'strip-ansi'

export function spacedLog(...messages: unknown[]): void {
  console.log()
  console.log(...messages)
  console.log()
}

export async function rmRf(path: string): Promise<void> {
  await fs.promises.rm(path, { recursive: true, force: true })
}

// MARK: usingSetValue
export function usingSetValue<T, Result>(set: Set<T>, value: T, callback: (value: T) => Result): Result
export function usingSetValue<T, Result>(
  set: Set<T>,
  value: T,
  callback: (value: T) => Promise<Result>,
): Promise<Result>
export function usingSetValue<T, Result>(
  set: Set<T>,
  value: T,
  callback: (value: T) => Result | Promise<Result>,
): Result | Promise<Result> {
  if (set.has(value)) {
    throw new Error(`Value ${value} already exists in set`)
  }

  let isPromise = false
  set.add(value)
  try {
    const result = callback(value)
    if (result instanceof Promise) {
      isPromise = true
      return result.finally(() => set.delete(value))
    }
    return result
  } finally {
    if (!isPromise) {
      set.delete(value)
    }
  }
}

// MARK: tagStdio
export function tagStdio(proc: ChildProcess, tag: string) {
  proc.stdout?.on('data', (data: Uint8Array | string) => {
    process.stdout.write(`${tag} `)
    process.stdout.write(data)
  })
  proc.stderr?.on('data', (data: Uint8Array | string) => {
    process.stderr.write(`${tag} `)
    process.stderr.write(data)
  })
}

// MARK: catchExit
export function catchExit(cleanup?: () => Promise<number | undefined> | number | undefined) {
  let exiting = false

  const asyncCleanup = () => {
    return Promise.resolve(cleanup?.())
  }

  const events = [
    'exit',
    'beforeExit',
    'SIGHUP',
    'SIGINT',
    'SIGQUIT',
    'SIGILL',
    'SIGTRAP',
    'SIGABRT',
    'SIGBUS',
    'SIGFPE',
    'SIGUSR1',
    'SIGSEGV',
    'SIGUSR2',
    'SIGTERM',
  ]
  for (const event of events) {
    const listener = () => {
      if (exiting) return
      exiting = true
      process.off(event, listener)
      void asyncCleanup()
        .then(v => {
          process.exit(v ?? 0)
        })
        .catch((err: unknown) => {
          const errStr = err instanceof Error ? (err.stack ?? err.toString()) : String(err)
          process.stderr.write(`Error when cleaning up: ${errStr}\n`)
          process.exit(1)
        })
    }
    process.on(event, listener)
  }

  const uncaughtExceptionHandler = (err: Error) => {
    process.off('uncaughtException', uncaughtExceptionHandler)
    void asyncCleanup().finally(() => {
      throw err
    })
  }
  process.on('uncaughtException', uncaughtExceptionHandler)
}

// MARK: waitProcess
export async function waitProcess(child: ChildProcess, timeoutMs?: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined
    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
    }

    child.on('exit', code => {
      clearTimeout(timer)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    child.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })

    if (timeoutMs !== undefined) {
      timer = setTimeout(() => {
        child.kill('SIGTERM')
        cleanup()
        reject(new Error('Timeout'))
      }, timeoutMs)
    }
  })
}

// MARK: waitProcessStdout
export async function waitProcessStdout(
  child: ChildProcess,
  stringOrRegExpOrPredicate: string | RegExp | ((data: string) => boolean),
  timeoutMs?: number,
): Promise<string> {
  const predicate = (data: string): boolean => {
    if (typeof stringOrRegExpOrPredicate === 'string') {
      return data.includes(stringOrRegExpOrPredicate)
    }
    if (stringOrRegExpOrPredicate instanceof RegExp) {
      return stringOrRegExpOrPredicate.test(data)
    }
    return stringOrRegExpOrPredicate(data)
  }

  return new Promise<string>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined
    const cleanup = () => {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
    }

    child.stdout?.on('data', (data: unknown) => {
      const str = stripAnsi(String(data))
      if (predicate(str)) {
        cleanup()
        resolve(str)
      }
    })

    child.on('error', (err: Error) => {
      cleanup()
      reject(err)
    })

    child.on('exit', (code: number | null) => {
      cleanup()
      reject(new Error(`Process exited with code ${code}`))
    })

    if (timeoutMs !== undefined) {
      timer = setTimeout(() => {
        child.kill('SIGTERM')
        cleanup()
        reject(new Error('Timeout'))
      }, timeoutMs)
    }
  })
}
