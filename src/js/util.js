export const extractOpenId = (str) =>
  str.length === 32 ? str : str.match('openid=(.*?)(?=&|$)')?.[1];

export const extractSignId = (str) =>{
  const match = str.match(/\/(\d+)\/(\d+)\/qr$/);
  if (match) {
    const signId = parseInt(match[2],10); // 倒数第二个数字
    return signId
  }
  return null
}
export const sleep = (ms) =>
  new Promise((reslove) => {
    setTimeout(reslove, ms);
});