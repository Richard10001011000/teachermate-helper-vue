<template>
  <div class="container">
    <div class="header">微助教签到</div>
    <div class="title">
      <div
        class="option" :class="{ active: showCurrent === true }" 
        @click="showCurrent=true"
      >
        正在进行的签到
      </div>
      <div class="option" :class="{ active: showCurrent === false }" 
        @click="showCurrent=false"
      >
        已经结束的签到
      </div>
    </div>

    <div class="sign-in-list">
     <div v-for="sign in showCurrent?current:history" :key="sign.signId" class="sign-item">
        <img :src="sign.cover" alt="签到封面" class="cover-image" />
        <div class="sign-info">
         <h3 :style="{ fontSize: sign.name.length<=10?'1rem':'0.8rem' }">{{ sign.name }}</h3>
          <div>
            <p :class="sign.category==='二维码签到'?'category-qr':'category-default'">
              {{ sign.category }}
            </p>
          </div>
          <div>
            <p :class="sign.status.ok ? 'status-ok' : 'status-not-ok'">
            {{ sign.status.ok ? `签到成功` : '未签到' }}
            {{ sign.status.ok && sign.status.signRank!==-1?` 你是第 ${sign.status.signRank}名`:"" }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="title">
      <div class="option active" @click="copyQrUrlSignList">
        正在进行的二维码签到（点击复制）
      </div>
    </div>

    <div class="sign-in-list">
      <div v-for="qrSign in qrList" :key="qrSign.signId" >
        <h3 :style="{ fontSize: '1.2rem', margin:0}">{{ qrSign.name }}</h3>
        <qrcode-vue :value="qrSign.qrUrl" :size="qrSize" level="H" />
      </div>
    </div>

    <div v-if="studentName.length" class="info-container" >
      <h2>您好 {{ studentName }}</h2>
      <h2>当前已发出签到请求 {{ sentCount }} 次</h2>
    </div>
    <div v-else class="info-container" >
      <h2>请先设置您的OpenId</h2>
    </div>

    <div class="button-container">
     <button class="toggle-button" @click="showInputOpenId=true">设置OpenId</button>
     <button class="toggle-button" :class="{ running: isRunning }" @click="handleStartSignIn">
        {{ isRunning ? '停 止 运 行' : '开 始 运 行' }}
      </button>
    </div>

    <van-dialog v-model:show="showInputOpenId" title="设置OpenId"   :before-close="beforeClose" show-cancel-button>
      <van-cell-group inset>
        <van-field v-model="openId" label="openId" placeholder="请输入openId或者携带openId的URL" />
      </van-cell-group>
    </van-dialog>
</div>
</template>

<script setup>
import { onMounted,ref } from 'vue';
import QrcodeVue from 'qrcode.vue'
import { showSuccessToast,showFailToast} from 'vant';
import { extractOpenId, extractSignId, sleep } from '../js/util';
import { config } from '../js/config';
import {activeSign,getStudentName,signIn} from '../js/request'
const isLoading = ref(true)
const showCurrent = ref(true)
const showInputOpenId = ref(false)
const isValidopenId = ref(false)
const isRunning = ref(false)
const openId = ref('');
const studentName = ref('')
const qrSize = ref(window.innerHeight * 25 / 100)
const sentCount = ref(0)

const current = ref([])
const history = ref([])
const qrList = ref([])
const beforeClose = async (action)=>{
  if(action==='confirm'){
    const result = await handleSetOpenId()
    return result
  }  
  return true
}

const copyQrUrlSignList = () => {
  const textToCopy = qrList.value.map(item => `${item.name}: ${item.qrUrl}`).join('\n\n');
  navigator.clipboard.writeText(textToCopy).then(() => {
    showSuccessToast("二维码链接已成功复制到剪贴板！")
  }).catch(e => {
   showFailToast("复制失败，请稍后再试！")
  });
};
const signOnce = async ()=>{
    const active = await activeSign(openId.value)
    const activeIds = new Set(active.map(item => item.signId));
    current.value.forEach(item => {
      if (!activeIds.has(item.signId)) {
        history.value.push(item);
      } 
    });
    current.value = current.value.filter(item => activeIds.has(item.signId))
    qrList.value = qrList.value.filter(item => activeIds.has(item.signId))
    const currentIds = new Set(current.value.map(item => item.signId));
    for(const item of active){
      if(!currentIds.has(item.signId)){
        current.value.push({
          signId:item.signId,
          courseId:item.courseId,
          name:item.name,
          category: item.isQR==1?'二维码签到':item.isGPS==1?'GPS签到':'普通签到',
          cover: item.cover,
          status: {
            ok:false,
            signRank:-1
          }
        })
      }
    }
    for (const sign of current.value) {
        const { signId, courseId, category } = sign;
        if(sign.status.ok) continue;
        if(category==='二维码签到'){          
            subscribe(courseId,signId);
        }else{
          let signInQuery = { courseId, signId };
          if(category==='GPS签到'){
            const {lat,lon} = config;
            signInQuery = { ...signInQuery, lat, lon };
          } 
          await sleep(config.wait);
          const signInResp = await signIn(openId.value, signInQuery)
          if(signInResp.signRank){
            sign.status.ok = true;
            sign.status.signRank = signInResp.studentRank
          }else if(signInResp?.msg=="repeat sign in"){
            sign.status.ok = true;
          }
        }
    }
}

const signMain = async ()=>{
  try {
    while(isRunning.value) {
      sentCount.value += 1
      connectWebSocket()
      await signOnce();
      await sleep(config.interval);
    } 
  }catch {
    showFailToast('OpenId失效，请重试设置OpenId')
    openId.value = ''
    studentName.value = ''
    isValidopenId.value = false
    isRunning.value = false
    return 
  }
}

const handleSetOpenId = async ()=>{
  try{
    if(!openId.value.length) throw 'e'
    openId.value = extractOpenId(openId.value)
    studentName.value = await getStudentName(openId.value)
    isValidopenId.value = true
    isRunning.value = false
    showSuccessToast(`设置OpenId成功\n您好 ${studentName.value}`)
    return true
  }catch{
    showFailToast('OpenId无效,请输入合法的openId或携带openId的URL')
    openId.value = ''
    studentName.value = ''
    isValidopenId.value = false
    isRunning.value = false
    return false
  }
}
const handleStartSignIn = async ()=>{
  if(isRunning.value){
    isRunning.value = false;
    showSuccessToast('停止运行')
    return 
  }
  if(!isValidopenId){
    openId.value = ''
    studentName.value = ''
    isRunning.value = false
    showFailToast('请先设置OpenId')
    return 
  }
  isRunning.value = true
  showSuccessToast('开始运行')
  signMain()
}

onMounted(()=>{
  isLoading.value = true
  connectWebSocket()
  isLoading.value = false
})
const endPoint = 'wss://www.teachermate.com.cn/faye'
const ws = {
  client:null,
  seqId:null,
  clientId: null,
  interval:null,
}
const connectWebSocket = () => {
  if(ws.client) return ;
  ws.client = new WebSocket(endPoint);
  ws.seqId = 0;
  ws.client.onopen = handshake
  
  ws.client.onmessage = (message) => {
      const messages = JSON.parse(message.data);
      handleMessage(messages);
  };
  ws.client.onclose = () => {
    console.log('WebSocket 连接已关闭');
    handleDisconnect()
  };
  ws.client.onerror = () => {
     handleDisconnect()
  }
}

const handleDisconnect = () =>{
   if (ws.client) {
    ws.client = null;
  }
}
const sendMessage = (msg) => {
  const data = JSON.stringify(msg ? [msg] : []);
  ws.client?.send(data);
};

const handshake = () =>{
  sendMessage({
      channel: '/meta/handshake',
      version: '1.0',
      supportedConnectionTypes: [
        'websocket',
        'eventsource',
        'long-polling',
        'cross-origin-long-polling',
        'callback-polling',
      ],
      id: ws.seqId++,
  });
}

const connect = () => {
    sendMessage({
      channel: '/meta/connect',
      clientId: ws.clientId,
      connectionType: 'websocket',
      id: ws.seqId++,
    });
  };

const startHeartbeat = (timeout) => {
  connect();
  ws.interval = setInterval(() => {
    connect();
  }, timeout);
};

const subscribe = (courseId,signId) => {
    sendMessage({
      channel: '/meta/subscribe',
      clientId: ws.clientId,
      subscription: `/attendance/${courseId}/${signId}/qr`,
      id: ws.seqId++,
    });
}

const testQRSubscription = (message) =>
    /attendance\/\d+\/\d+\/qr/.test(message.channel);
const handleMessage = (messages)=>{
  if (Array.isArray(messages) && messages.length === 0) return ;
  const message = messages[0];
  const { channel, successful } = message;
  if(successful){
    switch (channel) {
      case '/meta/handshake':
        const {
          clientId,advice: { timeout },
        } = message;
        ws.clientId = clientId;
        startHeartbeat(timeout);
        break;
      default:
        break;
    } 
  }else if (testQRSubscription(message)) {
      handleQRSubscription(message);
  } else {
    console.log(`${channel}: Failed!`);
    handleDisconnect()
  }
}

const QRType = {
    code:1,
    result:3,
}
const handleQRSubscription = async (message) => {
  const { channel,data } = message;
  const signId = extractSignId(channel) 
  for(const signIn of current.value){
    if(signIn.signId === signId){
       switch (data.type) {
        case QRType.code: {
          const { qrUrl } = data;
          if (!qrUrl) return;
          qrList.value = qrList.value.filter(item => item.signId!==signId)
          qrList.value.push({
            signId,
            name: signIn.name,
            qrUrl
          });
          break;
        }
        case QRType.result: {
          const { student } = data;
          if (student && student.name === studentName.value) {
            signIn.status.ok = true;
            signIn.status.signRank = student.rank
          }
          break;
        }
        default:
          break;
      }
      break;
    }
  }
};
</script>

<style scoped>
@import '../assets/index.css';
</style>