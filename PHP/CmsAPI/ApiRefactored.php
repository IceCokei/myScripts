<?php
/**
 * 视频APP API接口 - 重构版本
 * 
 * 功能说明：
 * 1. 用户管理：注册、登录、修改密码、修改昵称、头像上传
 * 2. 视频管理：视频列表、详情、搜索、排行榜、分类筛选
 * 3. 收藏管理：收藏、取消收藏、收藏列表
 * 4. 评论管理：评论列表、发送评论、子评论
 * 5. 弹幕管理：弹幕列表、发送弹幕
 * 6. 反馈管理：反馈建议、求片、催更
 * 7. 公告管理：公告列表、公告详情
 * 8. 版本管理：版本更新检测
 * 9. 消息管理：用户消息列表
 * 10. 会员管理：会员中心、购买会员
 * 11. 邀请管理：邀请码验证、邀请记录
 * 12. 积分管理：积分记录、观看激励广告
 */

namespace App\Api;

class ApiRefactored
{
    // 数据库连接
    private $db;
    
    // 当前用户信息
    private $user_info = null;
    private $user_id = 0;
    private $is_login = false;
    
    // 当前时间
    private $time;
    
    // 加密密钥
    private $secret_key = '';
    
    // 配置信息
    private $config = [];
    
    /**
     * 构造函数
     */
    public function __construct($db_config, $secret_key)
    {
        $this->time = time();
        $this->secret_key = $secret_key;
        $this->initDatabase($db_config);
        $this->loadConfig();
    }
    
    /**
     * 初始化数据库连接
     */
    private function initDatabase($config)
    {
        $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4";
        $this->db = new \PDO($dsn, $config['username'], $config['password']);
        $this->db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    }

    /**
     * 加载系统配置
     */
    private function loadConfig()
    {
        $stmt = $this->db->query("SELECT param_name, value FROM getapp_config");
        $configs = $stmt->fetchAll(\PDO::FETCH_KEY_PAIR);
        $this->config = $configs;
    }
    
    /**
     * 数据加密
     */
    private function encrypt($data)
    {
        $json = json_encode($data);
        return openssl_encrypt($json, 'AES-128-CBC', $this->secret_key, 0, $this->secret_key);
    }
    
    /**
     * 数据解密
     */
    private function decrypt($data)
    {
        $decrypted = openssl_decrypt($data, 'AES-128-CBC', $this->secret_key, 0, $this->secret_key);
        return json_decode($decrypted, true);
    }
    
    /**
     * 统一响应格式
     */
    private function response($code, $msg, $data = [])
    {
        $encrypted_data = $data ? $this->encrypt($data) : '';
        return json_encode([
            'code' => $code,
            'msg' => $msg,
            'data' => $encrypted_data
        ], JSON_UNESCAPED_UNICODE);
    }
    
    /**
     * 成功响应
     */
    private function success($data = [], $msg = '成功')
    {
        return $this->response(1, $msg, $data);
    }
    
    /**
     * 失败响应
     */
    private function error($msg = '失败', $code = 0)
    {
        return $this->response($code, $msg, []);
    }

    // ==================== 一、初始化接口 ====================
    
    /**
     * 初始化数据
     * 返回：首页轮播、推荐列表、分类列表、热门搜索、版本更新、公告、用户信息、系统配置
     */
    public function init()
    {
        // 获取首页轮播 - 推荐等级9
        $banner_list = $this->getVodByLevel(9, 10);
        
        // 获取广告轮播
        $advert_list = $this->getAdvertByPosition(2);
        $banner_list = array_merge($advert_list, $banner_list);
        
        // 获取当前热播 - 推荐等级8
        $recommend_list = $this->getVodByLevel(8, 20);
        
        // 获取分类列表
        $type_list = $this->getTypeList();
        
        // 获取热门搜索
        $hot_search_list = explode(',', $this->config['search_hot'] ?? '');
        
        // 获取版本更新
        $update = $this->getLatestVersion();
        
        // 获取置顶公告
        $notice = $this->getTopNotice();
        
        // 获取用户信息
        $user_info = $this->user_info;
        
        // 获取系统配置
        $config = $this->getSystemConfig();
        
        // 获取排期表
        $week_list = $this->getWeekList();
        
        // 获取页面设置
        $app_page_setting = $this->getPageSetting();
        
        return $this->success(compact(
            'banner_list', 'recommend_list', 'type_list', 
            'hot_search_list', 'update', 'notice', 
            'user_info', 'config', 'week_list', 'app_page_setting'
        ));
    }
    
    /**
     * 根据推荐等级获取视频列表
     */
    private function getVodByLevel($level, $limit = 10)
    {
        $sql = "SELECT vod_id, vod_name, vod_pic, vod_pic_slide, vod_remarks, vod_sub, 
                vod_class, vod_actor, vod_score, vod_year, vod_lang, vod_area, vod_blurb
                FROM mac_vod 
                WHERE vod_level = ? AND vod_status = 1
                ORDER BY vod_hits DESC 
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$level, $limit]);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // 处理图片地址
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic_slide'] ?: $item['vod_pic']);
        }
        
        return $list;
    }

    /**
     * 根据位置获取广告列表
     */
    private function getAdvertByPosition($position, $limit = 10)
    {
        $sql = "SELECT id as vod_id, name as vod_name, content as vod_pic, req_content as vod_link
                FROM getapp_advert 
                WHERE status = 1 AND position = ? 
                AND start_time < ? AND end_time > ?
                ORDER BY sort DESC 
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$position, $this->time, $this->time, $limit]);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic']);
        }
        
        return $list;
    }
    
    /**
     * 获取分类列表
     */
    private function getTypeList()
    {
        $sql = "SELECT type_id, type_name, type_extend 
                FROM mac_type 
                WHERE type_mid = 1 AND type_status = 1 AND type_pid = 0
                ORDER BY type_sort ASC";
        $stmt = $this->db->query($sql);
        $types = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // 获取每个分类的推荐视频
        foreach ($types as &$type) {
            $type['recommend_list'] = $this->getVodByTypeId($type['type_id'], 30);
            $type['filter_type_list'] = $this->getFilterTypes($type['type_extend']);
        }
        
        // 添加"全部"分类
        array_unshift($types, [
            'type_id' => 0,
            'type_name' => '全部',
            'recommend_list' => []
        ]);
        
        return $types;
    }
    
    /**
     * 根据分类ID获取视频列表
     */
    private function getVodByTypeId($type_id, $limit = 30)
    {
        $sql = "SELECT vod_id, vod_name, vod_pic, vod_remarks, vod_pic_slide
                FROM mac_vod 
                WHERE type_id = ? AND vod_status = 1
                ORDER BY vod_time DESC 
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$type_id, $limit]);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic']);
        }
        
        return $list;
    }

    /**
     * 获取筛选类型
     */
    private function getFilterTypes($type_extend)
    {
        $extends = json_decode($type_extend, true);
        $filter_list = [];
        
        if (!empty($extends['class'])) {
            $filter_list[] = ['name' => 'class', 'list' => array_merge(['全部'], explode(',', $extends['class']))];
        }
        if (!empty($extends['area'])) {
            $filter_list[] = ['name' => 'area', 'list' => array_merge(['全部'], explode(',', $extends['area']))];
        }
        if (!empty($extends['lang'])) {
            $filter_list[] = ['name' => 'lang', 'list' => array_merge(['全部'], explode(',', $extends['lang']))];
        }
        if (!empty($extends['year'])) {
            $filter_list[] = ['name' => 'year', 'list' => array_merge(['全部'], explode(',', $extends['year']))];
        }
        
        $filter_list[] = ['name' => 'sort', 'list' => ['最新', '最热', '最赞', '日榜', '周榜', '月榜']];
        
        return $filter_list;
    }
    
    /**
     * 获取最新版本
     */
    private function getLatestVersion()
    {
        $sql = "SELECT * FROM getapp_update ORDER BY version_code DESC LIMIT 1";
        $stmt = $this->db->query($sql);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * 获取置顶公告
     */
    private function getTopNotice()
    {
        $sql = "SELECT * FROM getapp_notice 
                WHERE status = 1 AND is_top = 1 
                ORDER BY sort DESC, create_time DESC 
                LIMIT 1";
        $stmt = $this->db->query($sql);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }
    
    /**
     * 获取系统配置
     */
    private function getSystemConfig()
    {
        return $this->config;
    }
    
    /**
     * 获取排期表
     */
    private function getWeekList()
    {
        $week_list = [];
        for ($i = 1; $i <= 7; $i++) {
            $sql = "SELECT vod_id, vod_name, vod_pic, vod_remarks 
                    FROM mac_vod 
                    WHERE vod_weekday = ? AND vod_status = 1
                    ORDER BY vod_time DESC 
                    LIMIT 20";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$i]);
            $week_list[$i] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }
        return $week_list;
    }
    
    /**
     * 获取页面设置
     */
    private function getPageSetting()
    {
        return [
            'show_rank' => true,
            'show_topic' => true,
            'show_week' => true,
            'show_find' => true
        ];
    }

    // ==================== 二、视频相关接口 ====================
    
    /**
     * 视频详情
     */
    public function vodDetail($vod_id)
    {
        // 获取视频信息
        $sql = "SELECT * FROM mac_vod WHERE vod_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$vod_id]);
        $vod = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$vod) {
            return $this->error('视频不存在');
        }
        
        // 更新播放次数
        $this->updateVodHits($vod_id);
        
        // 处理图片
        $vod['vod_pic'] = $this->getFullImageUrl($vod['vod_pic']);
        $vod['vod_content'] = strip_tags($vod['vod_content']);
        
        // 获取播放列表
        $vod_play_list = $this->parsePlayList($vod['vod_play_from'], $vod['vod_play_url']);
        
        // 获取评论列表
        $comment_list = $this->getCommentList($vod_id, 1);
        
        // 获取相关推荐
        $same_list = $this->getVodByTypeId($vod['type_id'], 9);
        
        // 是否收藏
        $is_collect = $this->checkIsCollect($vod_id);
        
        // 评论数量
        $comment_count = $this->getCommentCount($vod_id);
        
        // 获取广告
        $advert = $this->getAdvertByPosition(3, 1);
        $detail_advert = $this->getAdvertByPosition(4, 1);
        $comment_advert = $this->getAdvertByPosition(5, 1);
        
        return $this->success(compact(
            'vod', 'vod_play_list', 'comment_list', 'same_list',
            'is_collect', 'comment_count', 'advert', 'detail_advert', 'comment_advert'
        ));
    }
    
    /**
     * 更新视频播放次数
     */
    private function updateVodHits($vod_id)
    {
        $sql = "UPDATE mac_vod SET 
                vod_hits = vod_hits + 1,
                vod_hits_day = vod_hits_day + 1,
                vod_hits_week = vod_hits_week + 1,
                vod_hits_month = vod_hits_month + 1
                WHERE vod_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$vod_id]);
    }
    
    /**
     * 解析播放列表
     */
    private function parsePlayList($play_from, $play_url)
    {
        $from_list = explode('$$$', $play_from);
        $url_list = explode('$$$', $play_url);
        
        $play_list = [];
        foreach ($from_list as $key => $from) {
            if (isset($url_list[$key])) {
                $urls = explode('#', $url_list[$key]);
                $url_array = [];
                foreach ($urls as $url) {
                    $parts = explode('$', $url);
                    if (count($parts) == 2) {
                        $url_array[] = [
                            'name' => $parts[0],
                            'url' => $parts[1]
                        ];
                    }
                }
                $play_list[] = [
                    'player_info' => [
                        'show' => $from,
                        'parse' => '',
                        'parse_type' => 0
                    ],
                    'url_count' => count($url_array),
                    'urls' => $url_array
                ];
            }
        }
        
        return $play_list;
    }

    /**
     * 分类筛选列表
     */
    public function typeFilterVodList($params)
    {
        $page = $params['page'] ?? 1;
        $type_id = $params['type_id'] ?? 0;
        $class = $params['class'] ?? '';
        $area = $params['area'] ?? '';
        $lang = $params['lang'] ?? '';
        $year = $params['year'] ?? '';
        $sort = $params['sort'] ?? '最新';
        
        $where = ['vod_status = 1'];
        $bind = [];
        
        if ($type_id > 0) {
            $where[] = 'type_id = ?';
            $bind[] = $type_id;
        }
        if ($class && $class != '全部') {
            $where[] = 'vod_class LIKE ?';
            $bind[] = "%{$class}%";
        }
        if ($area && $area != '全部') {
            $where[] = 'vod_area = ?';
            $bind[] = $area;
        }
        if ($lang && $lang != '全部') {
            $where[] = 'vod_lang = ?';
            $bind[] = $lang;
        }
        if ($year && $year != '全部') {
            $where[] = 'vod_year = ?';
            $bind[] = $year;
        }
        
        // 排序
        $order_map = [
            '最新' => 'vod_time DESC',
            '最热' => 'vod_hits DESC',
            '最赞' => 'vod_score DESC',
            '日榜' => 'vod_hits_day DESC',
            '周榜' => 'vod_hits_week DESC',
            '月榜' => 'vod_hits_month DESC'
        ];
        $order = $order_map[$sort] ?? 'vod_time DESC';
        
        $limit = 30;
        $offset = ($page - 1) * $limit;
        
        $where_sql = implode(' AND ', $where);
        $sql = "SELECT vod_id, vod_name, vod_pic, vod_remarks, vod_pic_slide
                FROM mac_vod 
                WHERE {$where_sql}
                ORDER BY {$order}
                LIMIT {$offset}, {$limit}";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bind);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic']);
        }
        
        return $this->success(['recommend_list' => $list]);
    }
    
    /**
     * 搜索列表
     */
    public function searchList($params)
    {
        $page = $params['page'] ?? 1;
        $keywords = $params['keywords'] ?? '';
        $type_id = $params['type_id'] ?? 0;
        
        if (empty($keywords)) {
            return $this->error('请输入搜索关键词');
        }
        
        $where = ['vod_status = 1'];
        $bind = [];
        
        if ($type_id > 0) {
            $where[] = 'type_id = ?';
            $bind[] = $type_id;
        }
        
        $where[] = '(vod_name LIKE ? OR vod_actor LIKE ? OR vod_blurb LIKE ?)';
        $keyword_param = "%{$keywords}%";
        $bind[] = $keyword_param;
        $bind[] = $keyword_param;
        $bind[] = $keyword_param;
        
        $limit = 20;
        $offset = ($page - 1) * $limit;
        
        $where_sql = implode(' AND ', $where);
        $sql = "SELECT vod_id, vod_name, vod_pic, vod_remarks, vod_actor, vod_blurb
                FROM mac_vod 
                WHERE {$where_sql}
                ORDER BY vod_hits DESC
                LIMIT {$offset}, {$limit}";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bind);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic']);
        }
        
        return $this->success(['vod_list' => $list]);
    }

    /**
     * 排行榜
     */
    public function rankList($params)
    {
        $type_id = $params['type_id'] ?? 0;
        $rank_type = $params['rank_type'] ?? 'day';
        
        $order_map = [
            'day' => 'vod_hits_day',
            'week' => 'vod_hits_week',
            'month' => 'vod_hits_month'
        ];
        $order_field = $order_map[$rank_type] ?? 'vod_hits_day';
        
        $where = 'vod_status = 1';
        $bind = [];
        
        if ($type_id > 0) {
            $where .= ' AND type_id = ?';
            $bind[] = $type_id;
        }
        
        $sql = "SELECT vod_id, vod_name, vod_pic, vod_remarks, vod_score, {$order_field} as hits
                FROM mac_vod 
                WHERE {$where}
                ORDER BY {$order_field} DESC
                LIMIT 50";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($bind);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic']);
        }
        
        return $this->success(['vod_list' => $list]);
    }
    
    // ==================== 三、用户相关接口 ====================
    
    /**
     * 用户注册
     */
    public function appRegister($params)
    {
        $user_name = $params['user_name'] ?? '';
        $password = $params['password'] ?? '';
        $verify_code = $params['verify_code'] ?? '';
        
        // 验证参数
        if (empty($user_name) || empty($password)) {
            return $this->error('用户名和密码不能为空');
        }
        
        // 检查用户名是否存在
        $sql = "SELECT user_id FROM mac_user WHERE user_name = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user_name]);
        if ($stmt->fetch()) {
            return $this->error('用户名已存在');
        }
        
        // 创建用户
        $auth_token = md5(uniqid() . $user_name . time());
        $password_hash = md5($password);
        
        $sql = "INSERT INTO mac_user (user_name, user_pwd, user_reg_time, user_status, group_id) 
                VALUES (?, ?, ?, 1, 2)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user_name, $password_hash, $this->time]);
        $user_id = $this->db->lastInsertId();
        
        // 创建用户扩展信息
        $invite_code = $this->generateInviteCode();
        $sql = "INSERT INTO getapp_mac_user_extra (user_id, auth_token, invite_code) 
                VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user_id, $auth_token, $invite_code]);
        
        // 获取用户信息
        $user_info = $this->getUserByToken($auth_token);
        
        return $this->success([
            'user_info' => $user_info,
            'auth_token' => $auth_token
        ]);
    }

    /**
     * 用户登录
     */
    public function appLogin($params)
    {
        $user_name = $params['user_name'] ?? '';
        $password = $params['password'] ?? '';
        
        if (empty($user_name) || empty($password)) {
            return $this->error('用户名和密码不能为空');
        }
        
        $password_hash = md5($password);
        
        $sql = "SELECT * FROM mac_user WHERE user_name = ? AND user_pwd = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user_name, $password_hash]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$user) {
            return $this->error('用户名或密码错误');
        }
        
        if ($user['user_status'] != 1) {
            return $this->error('账号已被禁用');
        }
        
        // 获取或创建auth_token
        $sql = "SELECT auth_token FROM getapp_mac_user_extra WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$user['user_id']]);
        $extra = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$extra) {
            $auth_token = md5(uniqid() . $user_name . time());
            $invite_code = $this->generateInviteCode();
            $sql = "INSERT INTO getapp_mac_user_extra (user_id, auth_token, invite_code) 
                    VALUES (?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$user['user_id'], $auth_token, $invite_code]);
        } else {
            $auth_token = $extra['auth_token'];
        }
        
        // 获取用户信息
        $user_info = $this->getUserByToken($auth_token);
        
        return $this->success([
            'user_info' => $user_info,
            'auth_token' => $auth_token
        ]);
    }
    
    /**
     * 根据token获取用户信息
     */
    private function getUserByToken($auth_token)
    {
        $sql = "SELECT u.*, e.auth_token, e.invite_code, e.invite_count, e.avatar_update_time
                FROM mac_user u
                LEFT JOIN getapp_mac_user_extra e ON u.user_id = e.user_id
                WHERE e.auth_token = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$auth_token]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($user) {
            $user['user_avatar'] = $this->getUserAvatar($user);
            $user['is_vip'] = $this->checkIsVip($user);
            $user['vip_days'] = $this->getVipDays($user);
        }
        
        return $user;
    }
    
    /**
     * 获取用户头像
     */
    private function getUserAvatar($user)
    {
        if (!empty($user['user_portrait'])) {
            return $this->getFullImageUrl($user['user_portrait']);
        }
        
        $user_id = $user['user_id'];
        $avatar_path = "upload/user/" . ($user_id % 10) . "/{$user_id}.jpg";
        
        if (file_exists($avatar_path)) {
            return $this->getFullImageUrl($avatar_path . "?t=" . ($user['avatar_update_time'] ?? 0));
        }
        
        return '';
    }
    
    /**
     * 检查是否VIP
     */
    private function checkIsVip($user)
    {
        $vip_group_id = $this->config['vip_group_id'] ?? 3;
        return $user['group_id'] == $vip_group_id && $user['user_end_time'] > $this->time;
    }
    
    /**
     * 获取VIP剩余天数
     */
    private function getVipDays($user)
    {
        if ($this->checkIsVip($user)) {
            return ceil(($user['user_end_time'] - $this->time) / 86400);
        }
        return 0;
    }
    
    /**
     * 生成邀请码
     */
    private function generateInviteCode()
    {
        $characters = 'abcdefghijkmnpqrstuvwxyz';
        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $characters[mt_rand(0, strlen($characters) - 1)];
            }
            
            $sql = "SELECT user_id FROM getapp_mac_user_extra WHERE invite_code = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$code]);
            $exists = $stmt->fetch();
        } while ($exists);
        
        return $code;
    }

    // ==================== 四、收藏相关接口 ====================
    
    /**
     * 收藏/取消收藏
     */
    public function collect($vod_id)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        // 检查是否已收藏
        $sql = "SELECT id FROM getapp_vod_collect WHERE user_id = ? AND vod_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->user_id, $vod_id]);
        $collect = $stmt->fetch();
        
        if ($collect) {
            // 取消收藏
            $sql = "DELETE FROM getapp_vod_collect WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$collect['id']]);
            return $this->success([], '取消收藏成功');
        } else {
            // 添加收藏
            $sql = "INSERT INTO getapp_vod_collect (user_id, vod_id, create_time) VALUES (?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$this->user_id, $vod_id, $this->time]);
            return $this->success([], '收藏成功');
        }
    }
    
    /**
     * 检查是否收藏
     */
    private function checkIsCollect($vod_id)
    {
        if (!$this->is_login) {
            return false;
        }
        
        $sql = "SELECT id FROM getapp_vod_collect WHERE user_id = ? AND vod_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->user_id, $vod_id]);
        return (bool)$stmt->fetch();
    }
    
    /**
     * 收藏列表
     */
    public function collectList($page = 1)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        $limit = 20;
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT v.vod_id, v.vod_name, v.vod_pic, v.vod_remarks, c.create_time
                FROM getapp_vod_collect c
                LEFT JOIN mac_vod v ON c.vod_id = v.vod_id
                WHERE c.user_id = ?
                ORDER BY c.create_time DESC
                LIMIT {$offset}, {$limit}";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->user_id]);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['vod_pic'] = $this->getFullImageUrl($item['vod_pic']);
        }
        
        return $this->success(['vod_list' => $list]);
    }
    
    // ==================== 五、评论相关接口 ====================
    
    /**
     * 评论列表
     */
    private function getCommentList($vod_id, $page = 1)
    {
        $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT c.*, u.user_name, u.user_portrait
                FROM mac_comment c
                LEFT JOIN mac_user u ON c.user_id = u.user_id
                WHERE c.comment_mid = 1 AND c.comment_rid = ? AND c.comment_status = 1 AND c.comment_pid = 0
                ORDER BY c.comment_time DESC
                LIMIT {$offset}, {$limit}";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$vod_id]);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($list as &$item) {
            $item['user_avatar'] = $this->getFullImageUrl($item['user_portrait']);
            $item['reply_count'] = $this->getCommentReplyCount($item['comment_id']);
        }
        
        return $list;
    }
    
    /**
     * 获取评论回复数量
     */
    private function getCommentReplyCount($comment_id)
    {
        $sql = "SELECT COUNT(*) as count FROM mac_comment 
                WHERE comment_pid = ? AND comment_status = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$comment_id]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result['count'];
    }
    
    /**
     * 获取评论数量
     */
    private function getCommentCount($vod_id)
    {
        $sql = "SELECT COUNT(*) as count FROM mac_comment 
                WHERE comment_mid = 1 AND comment_rid = ? AND comment_status = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$vod_id]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $result['count'];
    }
    
    /**
     * 发送评论
     */
    public function sendComment($params)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        $vod_id = $params['vod_id'] ?? 0;
        $comment = $params['comment'] ?? '';
        $reply_comment_id = $params['reply_comment_id'] ?? 0;
        
        if (empty($comment)) {
            return $this->error('评论内容不能为空');
        }
        
        // 过滤敏感词
        $comment = $this->filterWords($comment);
        
        // 是否需要审核
        $status = $this->config['system_comment_status'] == 1 ? 0 : 1;
        
        $sql = "INSERT INTO mac_comment (comment_mid, comment_rid, comment_pid, user_id, 
                comment_content, comment_time, comment_status, comment_ip) 
                VALUES (1, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $vod_id, 
            $reply_comment_id, 
            $this->user_id, 
            $comment, 
            $this->time, 
            $status,
            $this->getClientIp()
        ]);
        
        return $this->success([], $status == 0 ? '评论已提交，等待审核' : '评论成功');
    }
    
    /**
     * 过滤敏感词
     */
    private function filterWords($text)
    {
        $filter_words = explode(',', $this->config['filter_words'] ?? '');
        return str_replace($filter_words, '***', $text);
    }
    
    /**
     * 获取客户端IP
     */
    private function getClientIp()
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            return $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        }
    }

    // ==================== 六、弹幕相关接口 ====================
    
    /**
     * 弹幕列表
     */
    public function danmuList($params)
    {
        $vod_id = $params['vod_id'] ?? 0;
        $url_position = $params['url_position'] ?? 0;
        
        $sql = "SELECT * FROM getapp_vod_danmu 
                WHERE vod_id = ? AND url_position = ? AND status = 1
                ORDER BY time ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$vod_id, $url_position]);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return $this->success(['danmu_list' => $list]);
    }
    
    /**
     * 发送弹幕
     */
    public function sendDanmu($params)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        $vod_id = $params['vod_id'] ?? 0;
        $url_position = $params['url_position'] ?? 0;
        $text = $params['text'] ?? '';
        $color = $params['color'] ?? '#FFFFFF';
        $time = $params['time'] ?? 0;
        $position = $params['position'] ?? 0;
        
        if (empty($text)) {
            return $this->error('弹幕内容不能为空');
        }
        
        // 过滤敏感词
        $text = $this->filterWords($text);
        
        // 解析时间跳转
        $time_info = $this->parseTimeFromText($text);
        
        // 是否需要审核
        $status = $this->config['system_danmu_status'] == 1 ? 0 : 1;
        
        $sql = "INSERT INTO getapp_vod_danmu (vod_id, url_position, text, color, time, 
                position, status, create_time, user_id, seek_to_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $vod_id,
            $url_position,
            $text,
            $color,
            $time,
            $position,
            $status,
            $this->time,
            $this->user_id,
            $time_info['seek_to_time']
        ]);
        
        return $this->success([], $status == 0 ? '弹幕已提交，等待审核' : '弹幕发送成功');
    }
    
    /**
     * 从文本中解析时间
     */
    private function parseTimeFromText($text)
    {
        $pattern = '/(?:(\d{1,2})[:：])?(\d{1,2})[:：](\d{1,2})/u';
        
        if (preg_match($pattern, $text, $matches)) {
            $hours = isset($matches[1]) && $matches[1] ? intval($matches[1]) : 0;
            $minutes = intval($matches[2]);
            $seconds = intval($matches[3]);
            
            $total_seconds = $hours * 3600 + $minutes * 60 + $seconds;
            
            return [
                'time_str' => $matches[0],
                'seek_to_time' => $total_seconds * 1000
            ];
        }
        
        return [
            'time_str' => '',
            'seek_to_time' => 0
        ];
    }
    
    // ==================== 七、反馈相关接口 ====================
    
    /**
     * 反馈建议
     */
    public function suggest($content)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        if (empty($content)) {
            return $this->error('反馈内容不能为空');
        }
        
        $sql = "INSERT INTO getapp_user_suggest (user_id, content, create_time) 
                VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->user_id, $content, $this->time]);
        
        return $this->success([], '反馈提交成功');
    }
    
    /**
     * 求片
     */
    public function find($params)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        $name = $params['name'] ?? '';
        $remark = $params['remark'] ?? '';
        
        if (empty($name)) {
            return $this->error('片名不能为空');
        }
        
        $sql = "INSERT INTO getapp_user_find (user_id, name, remark, create_time) 
                VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->user_id, $name, $remark, $this->time]);
        
        return $this->success([], '求片提交成功');
    }
    
    /**
     * 催更
     */
    public function requestUpdate($vod_id)
    {
        if (!$this->is_login) {
            return $this->error('请先登录');
        }
        
        // 检查是否已催更
        $sql = "SELECT * FROM getapp_request_update WHERE user_id = ? AND vod_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$this->user_id, $vod_id]);
        $record = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($record) {
            // 更新催更次数
            $sql = "UPDATE getapp_request_update SET times = times + 1, update_time = ? 
                    WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$this->time, $record['id']]);
        } else {
            // 新增催更记录
            $sql = "INSERT INTO getapp_request_update (user_id, vod_id, update_time, times) 
                    VALUES (?, ?, ?, 1)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$this->user_id, $vod_id, $this->time]);
        }
        
        return $this->success([], '催更成功');
    }
    
    // ==================== 八、公告相关接口 ====================
    
    /**
     * 公告列表
     */
    public function noticeList($page = 1)
    {
        $limit = 10;
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT * FROM getapp_notice 
                WHERE status = 1
                ORDER BY is_top DESC, sort DESC, create_time DESC
                LIMIT {$offset}, {$limit}";
        
        $stmt = $this->db->query($sql);
        $list = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        return $this->success(['notice_list' => $list]);
    }
    
    /**
     * 公告详情
     */
    public function noticeDetail($notice_id)
    {
        $sql = "SELECT * FROM getapp_notice WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$notice_id]);
        $notice = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if (!$notice) {
            return $this->error('公告不存在');
        }
        
        return $this->success(['notice' => $notice]);
    }
    
    // ==================== 九、工具方法 ====================
    
    /**
     * 获取完整图片URL
     */
    private function getFullImageUrl($path)
    {
        if (empty($path)) {
            return '';
        }
        
        if (strpos($path, 'http') === 0) {
            return $path;
        }
        
        $domain = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'];
        return $domain . '/' . ltrim($path, '/');
    }
}
