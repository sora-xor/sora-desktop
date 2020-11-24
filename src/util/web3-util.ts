import Web3 from 'web3'
import Wallet from 'ethereumjs-wallet'
import EthUtil from 'ethjs-util'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { AbiItem } from 'web3-utils'
import configUtil from '@/util/config-util'

interface ExecutionInfo {
  web3: Web3;
  contractInfo: InfoContract;
  contractAddress: string;
  method: string;
  methodArgs: string[];
  accountPrivate: string;
  accountAddress: string;
}

interface InfoContract {
  abi: AbiItem;
  code: string;
}

interface JsonContract {
  abi: AbiItem;
  evm: {
    bytecode: {
      object: string;
    };
  };
}

const PROTOCOL = configUtil.getUrlProtocol

const emptyWeb3 = new Web3()

function createEthereumAccount (privateKey: string | undefined) {
  if (privateKey) {
    return emptyWeb3.eth.accounts.privateKeyToAccount(privateKey)
  }
  return emptyWeb3.eth.accounts.create()
}

function deriveEthereumPublicKey (privateKey) {
  const privateKeyCopy = EthUtil.stripHexPrefix(privateKey)
  const buffer = EthUtil.intToBuffer(privateKeyCopy)
  const hex = Wallet
    .fromPrivateKey(buffer)
    .getPublicKeyString()
  return new BigNumber(hex).toString(10)
}

function signEthereumTransaction (data, privateKey) {
  return emptyWeb3.eth.accounts.sign(
    data,
    privateKey
  )
}

function createRegistrationProof (privateKey: string | undefined) {
  const account = createEthereumAccount(privateKey)
  const publicKey = deriveEthereumPublicKey(account.privateKey)
  const { v, r, s } = signEthereumTransaction(
    account.address.toLocaleLowerCase(),
    account.privateKey
  )

  return {
    publicKey,
    privateKey: account.privateKey,
    signature: {
      v: EthUtil.stripHexPrefix(v),
      r: EthUtil.stripHexPrefix(r),
      s: EthUtil.stripHexPrefix(s)
    }
  }
}

async function readSmartContract (name) {
  try {
    const { data } = await axios.get(`/contracts/${name}`)
    return data
  } catch (error) {
    console.error(error)
  }
}

function getInfoFromContract (contract: JsonContract): InfoContract {
  return {
    abi: contract.abi,
    code: `0x${contract.evm.bytecode.object}`
  }
}

function createWeb3Provider (url) {
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://:ea97737fd70e4e0ba2b6e25fea65c8a8@${url}`
    )
  )
  return web3
}

async function executeContractMethod ({
  web3,
  contractInfo,
  contractAddress,
  method,
  methodArgs,
  accountPrivate,
  accountAddress
}: ExecutionInfo) {
  const createWeb3Contract = ({ abi }) => {
    return new web3.eth.Contract(abi)
  }

  await web3.eth.accounts.wallet.add(accountPrivate)

  const contract = createWeb3Contract(contractInfo)

  contract.options.address = contractAddress

  const contractMethod = contract.methods[method](...methodArgs)
  const gas = await contractMethod.estimateGas()

  return contractMethod
    .send({
      gas,
      from: accountAddress
    })
}

export {
  createRegistrationProof,
  createWeb3Provider,
  readSmartContract,
  getInfoFromContract,
  executeContractMethod
}
