<?php
/**
 * API使用示例
 */

require_once 'ApiRefactored.php';

use App\Api\ApiRefactored;

// 数据库配置
$db_config = [
    'host' => 'localhost',
    'database' => 'video_app',
    'username' => 'root',
    'password' => 'password'
];

// API密钥（16位）
$secret_key = '';

// 创建API实例
$api = new ApiRefactored($db_config, $secret_key);

// ==================== 使用示例 ====================

// 1. 初始化数据
$result = $api->init();
echo "初始化数据：\n";
echo $result . "\n\n";

// 2. 视频详情
$result = $api->vodDetail(1);
echo "视频详情：\n";
echo $result . "\n\n";

// 3. 分类筛选
$params = [
    'page' => 1,
    'type_id' => 1,
    'class' => '动作',
    'area' => '美国',
    'lang' => '英语',
    'year' => '2023',
    'sort' => '最新'
];
$result = $api->typeFilterVodList($params);
echo "分类筛选：\n";
echo $result . "\n\n";

// 4. 搜索
$params = [
    'page' => 1,
    'keywords' => '复仇者联盟',
    'type_id' => 0
];
$result = $api->searchList($params);
echo "搜索结果：\n";
echo $result . "\n\n";

// 5. 排行榜
$params = [
    'type_id' => 1,
    'rank_type' => 'day'
];
$result = $api->rankList($params);
echo "排行榜：\n";
echo $result . "\n\n";

// 6. 用户注册
$params = [
    'user_name' => 'testuser',
    'password' => '123456',
    'verify_code' => '1234'
];
$result = $api->appRegister($params);
echo "用户注册：\n";
echo $result . "\n\n";

// 7. 用户登录
$params = [
    'user_name' => 'testuser',
    'password' => '123456'
];
$result = $api->appLogin($params);
echo "用户登录：\n";
echo $result . "\n\n";

// 8. 收藏视频
$result = $api->collect(1);
echo "收藏视频：\n";
echo $result . "\n\n";

// 9. 收藏列表
$result = $api->collectList(1);
echo "收藏列表：\n";
echo $result . "\n\n";

// 10. 发送评论
$params = [
    'vod_id' => 1,
    'comment' => '这部电影真不错！',
    'reply_comment_id' => 0
];
$result = $api->sendComment($params);
echo "发送评论：\n";
echo $result . "\n\n";

// 11. 弹幕列表
$params = [
    'vod_id' => 1,
    'url_position' => 0
];
$result = $api->danmuList($params);
echo "弹幕列表：\n";
echo $result . "\n\n";

// 12. 发送弹幕
$params = [
    'vod_id' => 1,
    'url_position' => 0,
    'text' => '精彩！',
    'color' => '#FFFFFF',
    'time' => 60000,
    'position' => 0
];
$result = $api->sendDanmu($params);
echo "发送弹幕：\n";
echo $result . "\n\n";

// 13. 反馈建议
$result = $api->suggest('希望增加更多电影');
echo "反馈建议：\n";
echo $result . "\n\n";

// 14. 求片
$params = [
    'name' => '蜘蛛侠：英雄无归',
    'remark' => '希望能尽快上线'
];
$result = $api->find($params);
echo "求片：\n";
echo $result . "\n\n";

// 15. 催更
$result = $api->requestUpdate(1);
echo "催更：\n";
echo $result . "\n\n";

// 16. 公告列表
$result = $api->noticeList(1);
echo "公告列表：\n";
echo $result . "\n\n";

// 17. 公告详情
$result = $api->noticeDetail(1);
echo "公告详情：\n";
echo $result . "\n\n";
