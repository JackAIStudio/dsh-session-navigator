import assert from 'node:assert/strict'
import { isAbsolute, join, resolve } from 'node:path'
import { describe, it } from 'node:test'
import { DSH_HOME_ENV, expandHomePath, resolveDshHome } from '../home-paths.js'

const HOME = '/Users/example'

describe('expandHomePath', () => {
  it('expands the three tilde spellings and leaves everything else alone', () => {
    assert.equal(expandHomePath('~', HOME), HOME)
    assert.equal(expandHomePath('~/custom', HOME), join(HOME, 'custom'))
    assert.equal(expandHomePath('~\\custom', HOME), join(HOME, 'custom'))
    assert.equal(expandHomePath('/absolute/path', HOME), '/absolute/path')
    assert.equal(expandHomePath('relative/path', HOME), 'relative/path')
    assert.equal(expandHomePath('', HOME), '')
    assert.equal(expandHomePath(undefined, HOME), undefined)
  })
})

describe('resolveDshHome', () => {
  it('prefers the explicit override over $DSH_HOME and the default', () => {
    const env = { [DSH_HOME_ENV]: '/profile/from-env' }
    assert.equal(resolveDshHome('/profile/explicit', env, HOME), '/profile/explicit')
    assert.equal(resolveDshHome(undefined, env, HOME), '/profile/from-env')
    assert.equal(resolveDshHome(undefined, {}, HOME), join(HOME, '.dsh'))
  })

  it('treats blank overrides as unset instead of resolving to the cwd', () => {
    assert.equal(resolveDshHome('   ', { [DSH_HOME_ENV]: '  ' }, HOME), join(HOME, '.dsh'))
    assert.equal(resolveDshHome('  ', { [DSH_HOME_ENV]: '/profile/from-env' }, HOME), '/profile/from-env')
    assert.equal(resolveDshHome('', {}, HOME), join(HOME, '.dsh'))
  })

  it('expands tilde homes and normalizes the result', () => {
    assert.equal(resolveDshHome('~/profile', {}, HOME), join(HOME, 'profile'))
    assert.equal(resolveDshHome('', { [DSH_HOME_ENV]: '~/profile/' }, HOME), join(HOME, 'profile'))
    assert.equal(isAbsolute(resolveDshHome('relative/profile', {}, HOME)), true)
    assert.equal(resolveDshHome('relative/profile', {}, HOME), resolve('relative/profile'))
  })
})
