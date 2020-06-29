import Vue from 'vue'
import {
  Dialog,
  Menu,
  MenuItem,
  Submenu,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Select,
  Option,
  Button,
  Table,
  TableColumn,
  DatePicker,
  Form,
  FormItem,
  Tag,
  Row,
  Col,
  Upload,
  Card,
  Container,
  Header,
  Aside,
  Main,
  Loading,
  Message,
  MessageBox,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Switch,
  Badge,
  Pagination,
  Checkbox,
  Tabs,
  TabPane
} from 'element-ui'
import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'

Vue.use(Dialog)
Vue.use(Menu)
Vue.use(MenuItem)
Vue.use(Submenu)
Vue.use(Input)
Vue.use(InputNumber)
Vue.use(Radio)
Vue.use(RadioGroup)
Vue.use(Select)
Vue.use(Option)
Vue.use(Button)
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(DatePicker)
Vue.use(Form)
Vue.use(FormItem)
Vue.use(Tag)
Vue.use(Row)
Vue.use(Col)
Vue.use(Upload)
Vue.use(Card)
Vue.use(Container)
Vue.use(Header)
Vue.use(Aside)
Vue.use(Main)
Vue.use(Dropdown)
Vue.use(DropdownMenu)
Vue.use(DropdownItem)
Vue.use(Tooltip)
Vue.use(Switch)
Vue.use(Badge)
Vue.use(Pagination)
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Loading.directive)
Vue.use(Checkbox)
const MsgBox = MessageBox
Vue.prototype.$prompt = MsgBox.prompt
Vue.prototype.$alert = MsgBox.alert
Vue.prototype.$message = Message
locale.use(lang)
