import format from 'date-fns/format'
import FileSaver from 'file-saver'

function transactionToBinary (tx) {
  return tx.serializeBinary()
}

function saveTransaction (tx) {
  const date = format(new Date(), 'MM-DD-YYYY-HH-mm-ss')
  const filename = `Transaction-${date}.draft`
  const binaryArray = transactionToBinary(tx)
  FileSaver.saveAs(new Blob([binaryArray]), filename)
}

export default {
  saveTransaction
}
