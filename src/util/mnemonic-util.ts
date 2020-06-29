import scrypt from 'scrypt-js'
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

const project = 'SORA'
const purpose = 'iroha keypair'
const password = ''

async function _deriveEthereumPrivateKey (mnemonic) {
  const seed = await bip39.mnemonicToSeed(mnemonic)
  const node = bip32.fromSeed(seed)
  const child = node.derivePath(`m/44'/60'/0'/0/0`)
  if (!child.privateKey) return ''
  return `0x${child.privateKey.toString('hex')}`
}

async function _deriveIrohaPrivateKey (project: string, mnemonic: string, purpose: string, password: string, length: number): Promise<any> {
  const E = Buffer.from(mnemonic)
  const salt = Buffer.from(`${project}|${purpose}|${password}`)

  return scrypt.scrypt(
    E,
    salt,
    16384,
    8,
    1,
    length
  )
}

async function irohaPrivateKeyFromMnemonic (project = '', mnemonic = '', purpose = '', password = '', length = 0): Promise<string> {
  let buffer = Buffer.from('')
  try {
    buffer = await _deriveIrohaPrivateKey(
      project.normalize('NFKD'),
      mnemonic.normalize('NFKD'),
      purpose.normalize('NFKD'),
      password.normalize('NFKD'),
      length
    )
  } catch (error) {}
  return Buffer.from(buffer).toString('hex')
}

export default {
  getIrohaKey: async (mnemonic: string): Promise<string> =>
    irohaPrivateKeyFromMnemonic(project, mnemonic, purpose, password, 32),
  getEthereumKey: async (mnemonic: string): Promise<string> =>
    _deriveEthereumPrivateKey(mnemonic),
  validate: (mnemonic: string): boolean =>
    bip39.validateMnemonic(mnemonic),
  generateMnemonic: (): string =>
    bip39.generateMnemonic()
}
