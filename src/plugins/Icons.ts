import Vue from 'vue'

import { library } from '@fortawesome/fontawesome-svg-core'

import { faCog } from '@fortawesome/free-solid-svg-icons/faCog'
import { faChartLine } from '@fortawesome/free-solid-svg-icons/faChartLine'
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet'
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons/faSignOutAlt'
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons/faFileInvoice'
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons/faExchangeAlt'
import { faAngleDoubleDown } from '@fortawesome/free-solid-svg-icons/faAngleDoubleDown'
import { faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons/faAngleDoubleUp'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons/faAngleRight'
import { faAngleDown } from '@fortawesome/free-solid-svg-icons/faAngleDown'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight'
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload'
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload'
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock'
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch'
import { faSortAlphaUp } from '@fortawesome/free-solid-svg-icons/faSortAlphaUp'
import { faSortAlphaDown } from '@fortawesome/free-solid-svg-icons/faSortAlphaDown'
import { faSortNumericUp } from '@fortawesome/free-solid-svg-icons/faSortNumericUp'
import { faSortNumericDown } from '@fortawesome/free-solid-svg-icons/faSortNumericDown'
import { faSortAmountUp } from '@fortawesome/free-solid-svg-icons/faSortAmountUp'
import { faSortAmountDown } from '@fortawesome/free-solid-svg-icons/faSortAmountDown'
import { faFile } from '@fortawesome/free-solid-svg-icons/faFile'
import { faFilePdf } from '@fortawesome/free-solid-svg-icons/faFilePdf'
import { faFileExcel } from '@fortawesome/free-solid-svg-icons/faFileExcel'
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons/faPencilAlt'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faCog,
  faChartLine,
  faWallet,
  faSignOutAlt,
  faFileInvoice,
  faExchangeAlt,
  faAngleDoubleDown,
  faAngleDoubleUp,
  faAngleRight,
  faAngleDown,
  faArrowRight,
  faDownload,
  faUpload,
  faClock,
  faSearch,
  faSortAlphaUp,
  faSortAlphaDown,
  faSortNumericUp,
  faSortNumericDown,
  faSortAmountUp,
  faSortAmountDown,
  faFile,
  faFileExcel,
  faFilePdf,
  faPlus,
  faPencilAlt,
  faTrashAlt
)
Vue.component('fa-icon', FontAwesomeIcon)
