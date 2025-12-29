// ==UserScript==
// @name         爱快 e云 弹窗屏蔽
// @namespace    ikuai-hide-notice-safe
// @version      1.1
// @author       Coke
// @description  隐藏爱快 e云 APP 弹窗，不破坏前端渲染
// @date         2025-12-30 01:45
// @match        http://192.168.50.9/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let handled = false;

    function hideNotice() {
        const notices = document.querySelectorAll('.notice_box');
        if (!notices.length) return;

        notices.forEach(notice => {
            notice.style.display = 'none';
            notice.style.visibility = 'hidden';
            notice.style.pointerEvents = 'none';
            notice.style.zIndex = '-1';

            // 仅当父级明显是弹窗容器时才隐藏
            const parent = notice.parentElement;
            if (parent && parent !== document.body && parent.children.length === 1) {
                parent.style.display = 'none';
            }
        });

        if (!handled) {
            console.log('[爱快] e云弹窗已安全隐藏');
            handled = true;
        }
    }

    // 首次执行
    hideNotice();

    // 监听新增节点，避免无意义触发
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            if (m.addedNodes && m.addedNodes.length) {
                hideNotice();
                break;
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
