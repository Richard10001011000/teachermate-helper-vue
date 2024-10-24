import axios from 'axios';
import { showFailToast } from 'vant';

const API = {
  ACTIVE_SIGN: 'http://120.26.130.74:80/wechat-api/v1/class-attendance/student/active_signs',
  SIGN_IN: 'http://120.26.130.74:80/wechat-api/v1/class-attendance/student-sign-in',
  STUDENTS_ROLE: 'http://120.26.130.74:80/wechat-api/v2/students/role',
  STUDENT: 'http://120.26.130.74:80/wechat-api/v2/students',
};


const baseHeaders = {
  'Content-Type': 'application/json',
  'Accept': '*/*',
  'Accept-Language': 'zh-CN,en-US;q=0.7,en;q=0.3',
};

// 创建 axios 实例
const request = axios.create();

// 配置响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      return Promise.reject(error.response.data);
    } else {
      return Promise.reject('Error: expired or invalid openId!');
    }
  }
);

const getHeaders = (openId) => ({
  headers: {
    ...baseHeaders,
    openId,
    'If-None-Match': '"38-djBNGTNDrEJXNs9DekumVQ"',
    referer: `https://v18.teachermate.cn/wechat-pro-ssr/student/sign?openid=${openId}`,
  }
});

export const activeSign = (openId) => {
  return request.get(API.ACTIVE_SIGN, getHeaders(openId));
};

export const signIn = (openId, query) => {
  return request.post(API.SIGN_IN, query, getHeaders(openId));
};

const students = (openId) => {
  return request.get(API.STUDENT, getHeaders(openId));
};

export const getStudentName = async (openId) => {
  const data = await students(openId);
  const studentName = data[0].find((item) => item.item_name === 'name').item_value;
  return studentName;
};