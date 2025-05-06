/**
 * 小红书笔记解析工具
 * desc=小红书链接解析
 * author = Coke
 * time = 2025-05-06 20:27:01
 * 通过 xiaohongshu.day API 获取小红书笔记的详细信息
 */
var request = require('request');

/**
 * 解析小红书笔记链接，获取笔记详细信息
 * @param {string} url - 小红书笔记链接，支持PC端和移动端链接
 * @param {function} callback - 回调函数，参数为(error, data)
 */
function parseXiaohongshuNote(url, callback) {
    // 从URL中提取noteId
    const noteIdMatch = url.match(/\/(?:explore|discovery\/item)\/([0-9a-f]+)/);
    if (!noteIdMatch || !noteIdMatch[1]) {
        return callback(new Error('无效的小红书链接，无法提取笔记ID'), null);
    }

    const noteId = noteIdMatch[1];

    // 保留原始URL中的参数
    const urlParams = new URL(url).search;

    // 构建API请求URL
    const apiUrl = `https://xiaohongshu.day/api/note/${noteId}${urlParams}`;

    const headers = {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://xiaohongshu.day/zh/',
        'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    };

    const options = {
        url: apiUrl,
        headers: headers
    };

    request(options, function (error, response, body) {
        if (error) {
            return callback(error, null);
        }

        if (response.statusCode !== 200) {
            return callback(new Error(`API请求失败，状态码: ${response.statusCode}`), null);
        }

        try {
            const result = JSON.parse(body);
            if (!result.success) {
                return callback(new Error('API返回失败状态'), null);
            }

            callback(null, result.data);
        } catch (e) {
            callback(new Error('解析API响应失败: ' + e.message), null);
        }
    });
}

/**
 * 获取小红书笔记中的精简信息和媒体资源
 * @param {string} url - 小红书笔记链接
 * @param {function} callback - 回调函数，参数为(error, mediaUrls)
 */
function getXiaohongshuMedia(url, callback) {
    parseXiaohongshuNote(url, function (error, data) {
        if (error) {
            return callback(error, null);
        }

        // 格式化时间
        const date = new Date(data.time);
        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        // 只保留需要的信息
        const result = {
            title: data.title,
            desc: data.desc,
            time: formattedDate
        };

        // 根据笔记类型返回不同的媒体资源
        if (data.type === 'video') {
            result.images = data.images ? data.images.map(img => img.url) : [];
            result.video = {
                url: data.video.url,
                backupUrls: data.video.backupUrls || []
            };
        } else {
            // 图片类型
            result.images = data.images.map(img => img.url);
        }

        callback(null, result);
    });
}

/**
 * 美化输出日志
 * @param {Object} data - 要输出的数据
 */
function prettyPrint(data) {
    const emoji = {
        title: '📝',
        desc: '📄',
        time: '⏰',
        images: '🖼️',
        backupUrls: '📁'
    };

    // 处理描述文本，只清理特殊标记和乱码，保留原始格式
    const cleanDesc = data.desc
        .replace(/\[话题\]/g, '') // 移除[话题]标记
        .replace(/\[.*?R\]/g, '') // 移除特定标记如[派对R]
        .replace(/﻿/g, '') // 移除零宽字符
        .replace(/#([^#]+)#\s*/g, '#$1 '); // 清理话题标签周围的乱码

    console.log('\n' + '='.repeat(50));
    console.log(`${emoji.title} 标题: ${data.title}`);
    console.log(`${emoji.desc} 描述: ${cleanDesc}`);
    console.log(`${emoji.time} 时间: ${data.time}`);

    if (data.images && data.images.length > 0) {
        console.log(`${emoji.images} 图片链接:`);
        data.images.forEach(url => {
            console.log(`  ${url}`);
        });
    }

    if (data.video && data.video.backupUrls && data.video.backupUrls.length > 0) {
        console.log(`${emoji.backupUrls} 视频备用链接:`);
        data.video.backupUrls.forEach(url => {
            console.log(`  ${url}`);
        });
    }
    console.log('='.repeat(50) + '\n');
}

// 解析地址
const url = 'https://www.xiaohongshu.com/discovery/item/681257b0000000000903b8b1?source=yamcha_homepage&xsec_token=AB8uNGrfGiR7XbLL4G-2UYmBk5ImwAQcgTLi60l-xbmzE=&xsec_source=h5_feed';
getXiaohongshuMedia(url, function (error, result) {
    if (error) {
        console.error('❌ 获取失败:', error.message);
        return;
    }
    prettyPrint(result);
});