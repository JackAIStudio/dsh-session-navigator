import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * Resolve the harness home this process is actually running against.
 *
 * Every DSH instance keeps its own profile — the packaged JackDSH app boots
 * with `DSH_HOME=~/Library/Application Support/jackdsh/dsh-data`, while a plain
 * `dsh web` from the CLI keeps the default `~/.dsh`. Session ids are
 * profile-local, so anything derived from a session id (pins, the FTS index,
 * the projection cache) has to be resolved from the same home the sessions
 * live in. Hardcoding `~/.dsh` silently reads another profile's data.
 */

/** Environment variable that overrides the default DeepSeek Harness home. */
export const DSH_HOME_ENV = 'DSH_HOME'

/** Directory name of the default harness home under the OS home. */
export const DSH_HOME_DIR_NAME = '.dsh'

/** Expand `~`, `~/x` and `~\x` against the operating-system home. */
export function expandHomePath(path, home = homedir()) {
  if (typeof path !== 'string' || path === '') return path
  if (path === '~') return home
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(home, path.slice(2))
  return path
}

/**
 * Resolve the single-root harness home.
 *
 * Precedence, highest first: an explicit configured path, `$DSH_HOME`, then
 * `~/.dsh`. A blank or whitespace-only value at either level counts as unset
 * rather than resolving the home to the current working directory.
 *
 * @param configured - explicit harness-home override, which has highest precedence.
 * @param env - environment mapping used to read `DSH_HOME`.
 * @param home - operating-system home used for `~` expansion and the default.
 * @returns the normalized absolute harness home path.
 */
export function resolveDshHome(configured, env = process.env, home = homedir()) {
  const explicit = typeof configured === 'string' ? configured.trim() : ''
  if (explicit !== '') return resolve(expandHomePath(explicit, home))

  const fromEnv = typeof env?.[DSH_HOME_ENV] === 'string' ? env[DSH_HOME_ENV].trim() : ''
  if (fromEnv !== '') return resolve(expandHomePath(fromEnv, home))

  return join(home, DSH_HOME_DIR_NAME)
}
