/*
 * CSDN 解锁接口自动请求与解密工具
 * desc=csdn会员解锁
 * author = Coke
 * time = 2025-05-06 14:00:01
 * 
 * 用法说明：
 * 1. 修改 data 对象内容为你需要解锁的 CSDN 文章链接。
 * 2. 运行脚本，控制台输出加密密文和解密明文。
 *
 */

const CryptoJS = require('crypto-js');
const https = require('https');

// 固定IV和Key
const ivWords = [1364544068, 1381323335, 1296329524, 1316641073];
const keyWords = [1297369466, 1313101106, 1316644661, 1296385603];
const iv = CryptoJS.lib.WordArray.create(ivWords, 16);
const key = CryptoJS.lib.WordArray.create(keyWords, 16);

/**
 * 加密函数
 * @param {Object} dataObj - 需要加密的对象
 * @returns {string} - 加密后的Base64字符串
 */
function encryptData(dataObj) {
    const jsonString = JSON.stringify(dataObj);
    return CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(jsonString),
        key,
        { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
    ).toString();
}

/**
 * 解密函数
 * @param {string} encryptedStr - 加密后的Base64字符串
 * @returns {string} - 解密后的明文字符串
 */
function decryptData(encryptedStr) {
    const decrypted = CryptoJS.AES.decrypt(
        encryptedStr,
        key,
        { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.ZeroPadding }
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
}

// 修改data内容为csdn地址
const data = {
    data: "https://blog.csdn.net/2201_75600005/article/details/140252474?utm_medium=distribute.pc_relevant.none-task-blog-2~default~baidujs_baidulandingword~default-0-140252474-blog-109409081.235^v43^pc_blog_bottom_relevance_base2&spm=1001.2101.3001.4242.1&utm_relevant_index=2"
};

const encrypted = encryptData(data);
console.log('加密内容:', encrypted);

const postData = JSON.stringify({ data: encrypted });

const options = {
    hostname: 'csdn.zeroai.chat',
    path: '/v1/unlock',
    method: 'POST',
    headers: {
        'accept': '*/*',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; rv:21.0) Gecko/20130401 Firefox/21.0',
        'origin': 'https://csdn.zeroai.chat',
        'referer': 'https://csdn.zeroai.chat/',
        'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
    }
};

const req = https.request(options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const response = JSON.parse(rawData);
            const decryptedResponse = decryptData(response.data);
            console.log('解密明文:', decryptedResponse);
        } catch (e) {
            console.error('响应解析或解密失败:', e, rawData);
        }
    });
});

req.on('error', (e) => {
    console.error('请求失败:', e);
});

req.write(postData);
req.end();
