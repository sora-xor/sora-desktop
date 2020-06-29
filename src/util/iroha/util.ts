import {
  CommandService_v1Client as CommandService,
  QueryService_v1Client as QueryService
} from 'iroha-helpers/lib/proto/endpoint_pb_service'
import configUtil from '@/util/config-util'

interface Cache {
  mnemonic: string | null;
  username: string | null;
  key: string | null;
  nodeIp: string | null;
}

export const DEFAULT_TIMEOUT_LIMIT = 5000

/**
 * cached items available from start to end of the app
 * plus, `nodeIp` is persisted by localStorage
 */
export const cache: Cache = {
  mnemonic: null,
  username: null, // NOT persisted by localStorage
  // TODO: do not cache keys; require a private key on every action instead.
  // For now it is needed for queries until tokens are implemented.
  key: null, // NOT persisted by localStorage
  nodeIp: '' // persisted by localStorage
}

const DYNAMIC_URL = () => {
  const temp = `${configUtil.getUrlProtocol}//${cache.nodeIp}`
  const url = new URL(temp)
  return url.origin
}

export function setNodeIp (ip: string) {
  cache.nodeIp = ip
}

export function clearCache () {
  cache.mnemonic = null
  cache.username = null
  cache.key = null
  cache.nodeIp = ''
}

export function setCache (mnemonic: string, username: string, key: string, nodeIp?: string) {
  cache.mnemonic = mnemonic || cache.mnemonic
  cache.username = username || cache.username
  cache.key = key || cache.key
  cache.nodeIp = nodeIp || cache.nodeIp
}

export function newCommandService () {
  return new CommandService(DYNAMIC_URL())
}

export function newQueryService () {
  return new QueryService(DYNAMIC_URL())
}

export function newCommandServiceOptions (privateKeys, quorum) {
  return {
    privateKeys,
    quorum,
    creatorAccountId: cache.username,
    commandService: new CommandService(DYNAMIC_URL()),
    timeoutLimit: DEFAULT_TIMEOUT_LIMIT
  }
}

export function newQueryServiceOptions () {
  return {
    privateKey: cache.key,
    creatorAccountId: cache.username,
    queryService: new QueryService(DYNAMIC_URL()),
    timeoutLimit: DEFAULT_TIMEOUT_LIMIT
  }
}
