import { Vue, Component } from 'vue-property-decorator'

import map from 'lodash/fp/map'
import flatten from 'lodash/fp/flatten'
import sortedUniq from 'lodash/fp/sortedUniq'
import flow from 'lodash/fp/flow'
import tz, { Timezone } from 'timezones.json'
import format from 'date-fns/format'
import differenceInSeconds from 'date-fns/difference_in_seconds'

const timezones = flow(
  map((t: Timezone) => t.text),
  flatten,
  sortedUniq
)(tz)

const offsetByZone = (zone) =>
  tz.find(t => t.text === zone)

const convertTime = (date, zone) => {
  const currentZone = offsetByZone(zone)
  if (currentZone) {
    const timeZone = currentZone.offset
    const targetTime = new Date(date)
    const tzDifference = timeZone * 60 + targetTime.getTimezoneOffset()
    return new Date(targetTime.getTime() + tzDifference * 60 * 1000)
  }
  return new Date()
}

@Component
export default class DateFormat extends Vue {
  timezones = timezones

  formatTime (date) {
    const timeZoneLabel = this.$store.getters.settingsView.timezone
    const time = convertTime(date, timeZoneLabel)
    return format(time, 'HH:mm:ss')
  }
  formatDate (date) {
    const timeZoneLabel = this.$store.getters.settingsView.timezone
    const time = convertTime(date, timeZoneLabel)
    return format(time, 'MMM D, HH:mm').toUpperCase()
  }
  formatDateLong (date) {
    const timeZoneLabel = this.$store.getters.settingsView.timezone
    const time = convertTime(date, timeZoneLabel)
    return format(time, 'MMM D, YYYY HH:mm:ss').toUpperCase()
  }
  formatDateWith (date, formatString) {
    const timeZoneLabel = this.$store.getters.settingsView.timezone
    const time = convertTime(date, timeZoneLabel)
    return format(time, formatString)
  }
  compareDates (laterDate, earlierDate) {
    const diff = differenceInSeconds(laterDate, earlierDate)
    const hours = ~~(diff / 60 / 60) // return the quotient from division
    const minutes = (~~(diff / 60)) - (hours * 60)
    const seconds = diff % 60
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
}
