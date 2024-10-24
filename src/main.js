import { createApp } from 'vue'
import App from './App.vue'
import { Toast, Dialog,Field, CellGroup} from 'vant'
import 'vant/lib/index.css'
const app = createApp(App)
app.use(Toast).use(Dialog).use(Field).use(CellGroup)
app.mount('#app')
