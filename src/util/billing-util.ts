import axios from 'axios'
import configUtil from '@/util/config-util'

const PROTOCOL = configUtil.getUrlProtocol

const getBillingData = (url, domain, asset, billingType) => {
  const [assetId, assetDomain] = asset.split('#')
  return axios({
    baseURL: `${PROTOCOL}//${url}`,
    url: `/cache/get/billing/${domain}/${assetId}/${assetDomain}/${billingType}`
  })
    .then(({ data }) => data)
}

export default {
  getBillingData
}
