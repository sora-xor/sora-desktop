import { Vue, Component } from 'vue-property-decorator'

import numbro from 'numbro'
import BN from 'bignumber.js'
@Component({
  filters: {
    formatNumberShort: value => numbro(value).format({
      mantissa: 2,
      average: true
    }),
    formatNumberLong: value => numbro(value).format({
      mantissa: 2,
      thousandSeparated: true
    }),
    formatPercent: value => {
      const nP = numbro(value).format({
        mantissa: 2,
        average: true,
        forceSign: true
      })
      return `${nP}%`
    },
    formatNumberPercentDiff: value => {
      const nV = numbro(value.diff).format({
        mantissa: 2,
        average: true,
        forceSign: true,
        spaceSeparated: true
      })
      const nP = numbro(value.percent).format({
        mantissa: 2,
        average: true,
        forceSign: true
      })
      return `${nV} (${nP}%)`
    },
    formatPrecision: value => {
      const removeZeros = (v) => v.replace(/0+$/, '')
      const arrRepOfValue = `${value}`.split('.')
      const beforeDecimal = arrRepOfValue[0]
      const afterDecimal = removeZeros(arrRepOfValue[1] || '')
      const format = afterDecimal.length ? `.${afterDecimal}` : ''
      return new BN(`${beforeDecimal}${format}`)
        .toFormat({
          prefix: '',
          decimalSeparator: '.',
          groupSeparator: ' ',
          groupSize: 3,
          secondaryGroupSize: 0,
          fractionGroupSeparator: ' ',
          fractionGroupSize: 0,
          suffix: ''
        })
    }
  }
})
export default class NumberFormat extends Vue {
  /**
   * This function returns correct fee based on asset precision.
   * @param {Number | Null} a
   * @param {Number} b
   * @param {Number} precision
   * @returns {Number} Current fee or minimum available precision as fee
   */
  $multiply (a, b, precision) {
    return new BN(a || 0)
      .multipliedBy(b)
      .decimalPlaces(precision, BN.ROUND_UP)
  }
}
