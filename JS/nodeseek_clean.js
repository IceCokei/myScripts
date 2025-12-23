// ==UserScript==
// @name         NodeSeek 增强助手
// @description  NodeSeek论坛增强：自动签到 + 已浏览帖子标记 + 抽奖参与与中奖检测（无侧边栏、低分控）| 原作者: weiruankeji2025
// @namespace    https://github.com/weiruankeji2025/weiruan-nodeseek-Sign.in
// @version      1.0.0
// @author       Coke（二改自 weiruankeji2025）
// @match        https://www.nodeseek.com/*
// @icon         https://www.nodeseek.com/favicon.ico
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_addStyle
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        API_URL: 'https://www.nodeseek.com/api/attendance',
        STORAGE_KEY: 'ns_last_checkin',
        VISITED_KEY: 'ns_visited_posts',
        WIN_CHECK_KEY: 'ns_win_check',
        RANDOM_MODE: true,
        WIN_CHECK_INTERVAL: 10 * 60 * 1000
    };

    // ==================== 样式（仅保留已浏览标记） ====================
    GM_addStyle(`
        .post-list a.ns-visited-post,
        .post-item a.ns-visited-post,
        [class*="post"] a.ns-visited-post,
        a.post-title.ns-visited-post {
            color: #e74c3c !important;
            position: relative;
        }
        .post-list a.ns-visited-post::after,
        .post-item a.ns-visited-post::after,
        [class*="post"] a.ns-visited-post::after,
        a.post-title.ns-visited-post::after {
            content: ' [已浏览]';
            font-size: 10px;
            color: #e74c3c;
        }

        @media (prefers-color-scheme: dark) {
            .post-list a.ns-visited-post,
            a.post-title.ns-visited-post {
                color: #ff6b6b !important;
            }
        }
    `);

    // ==================== 工具函数 ====================
    const getToday = () => new Date().toISOString().slice(0, 10);
    const hasCheckedIn = () => GM_getValue(CONFIG.STORAGE_KEY) === getToday();

    const notify = (title, text) => {
        GM_notification({ title, text, timeout: 5000 });
        console.log(`[NS助手] ${title}: ${text}`);
    };

    const extractPostId = (url) => url?.match(/\/post-(\d+)/)?.[1];

    // ==================== 已浏览帖子管理 ====================
    const getVisitedPosts = () => GM_getValue(CONFIG.VISITED_KEY) || {};

    const markAsVisited = (postId) => {
        if (!postId) return;
        const visited = getVisitedPosts();
        visited[postId] = Date.now();

        // 仅保留 30 天
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        for (const id in visited) {
            if (visited[id] < cutoff) delete visited[id];
        }
        GM_setValue(CONFIG.VISITED_KEY, visited);
    };

    const markVisitedPostsOnPage = () => {
        const visited = getVisitedPosts();
        document.querySelectorAll('a[href*="/post-"]').forEach(link => {
            const postId = extractPostId(link.getAttribute('href'));
            if (postId && visited[postId]) {
                link.classList.add('ns-visited-post');
            }
        });
    };

    const trackCurrentPost = () => {
        const postId = extractPostId(location.href);
        if (postId) markAsVisited(postId);
    };

    // ==================== 自动签到 ====================
    const doCheckin = async () => {
        if (hasCheckedIn()) return;
        try {
            const res = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: `random=${CONFIG.RANDOM_MODE}`
            });
            const data = await res.json();
            if (data.success || /已签到|已完成/.test(data.message)) {
                GM_setValue(CONFIG.STORAGE_KEY, getToday());
                if (data.success) {
                    notify('签到成功', data.message || '签到完成');
                }
            }
        } catch (e) {
            console.error('[NS助手] 签到失败', e);
        }
    };

    // ==================== 抽奖参与记录 + 中奖检测 ====================
    const getParticipatedLotteries = () => GM_getValue(CONFIG.WIN_CHECK_KEY) || {};

    const addParticipatedLottery = (postId, title) => {
        const data = getParticipatedLotteries();
        if (!data[postId]) {
            data[postId] = { title, addedAt: Date.now(), won: false };
            GM_setValue(CONFIG.WIN_CHECK_KEY, data);
        }
    };

    const monitorLotteryParticipation = () => {
        const postId = extractPostId(location.href);
        if (!postId) return;
        if (!/抽奖|开奖/i.test(document.title)) return;

        setTimeout(() => {
            const currentUser = document.querySelector('[data-username]')?.getAttribute('data-username');
            if (!currentUser) return;

            document.querySelectorAll('.comment-item,[class*="reply"]').forEach(el => {
                if (el.textContent.includes(currentUser)) {
                    addParticipatedLottery(postId, document.title.replace(/ - NodeSeek$/, ''));
                }
            });
        }, 2000);
    };

    const checkWinStatus = async () => {
        const data = getParticipatedLotteries();
        const ids = Object.keys(data).filter(id => !data[id].won);

        for (const postId of ids.slice(0, 3)) {
            try {
                const res = await fetch(`https://www.nodeseek.com/post-${postId}.html`, { credentials: 'include' });
                if (!res.ok) continue;

                const html = await res.text();
                const user = html.match(/data-username="([^"]+)"/)?.[1];
                if (!user) continue;

                if (/已开奖|中奖名单|开奖结果/i.test(html)) {
                    const win = new RegExp(`@?${user}.*中奖|恭喜.*${user}`, 'i').test(html);
                    if (win) {
                        data[postId].won = true;
                        notify('🎉 恭喜中奖', `你在「${data[postId].title}」中奖了`);
                    }
                }
                GM_setValue(CONFIG.WIN_CHECK_KEY, data);
            } catch { }
        }
    };

    // ==================== 初始化 ====================
    const init = async () => {
        console.log('[NS助手] 精简版初始化');

        trackCurrentPost();
        markVisitedPostsOnPage();

        new MutationObserver(markVisitedPostsOnPage)
            .observe(document.body, { childList: true, subtree: true });

        await doCheckin();

        monitorLotteryParticipation();

        setTimeout(checkWinStatus, 5000);
        setInterval(checkWinStatus, CONFIG.WIN_CHECK_INTERVAL);
    };

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();

})();
