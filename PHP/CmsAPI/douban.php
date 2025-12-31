<?php
/**
 * 豆瓣电影/电视剧信息抓取接口
 * 
 * 功能说明：
 * - 通过豆瓣ID获取电影/电视剧的详细信息
 * - 自动识别电影和电视剧类型
 * - 返回标准JSON格式数据
 * 
 * 请求参数：
 * @param string $id 豆瓣电影/电视剧ID（必需）
 * 
 * 调用示例：
 * https://域名/douban.php?id=36323224
 * 
 * 返回格式：
 * {
 *   "code": 1,
 *   "auth": "内部API数据接口！",
 *   "msg": "提示：成功",
 *   "data": {
 *     "vod_name": "电影名称",
 *     "vod_year": "年份",
 *     "vod_score": "评分",
 *     "vod_pic": "海报图片",
 *     "vod_director": "导演",
 *     "vod_actor": "主演",
 *     "vod_class": "类型",
 *     "vod_area": "地区",
 *     "vod_content": "简介",
 *     ...更多字段
 *   }
 * }
 * 
 * 错误码：
 * - 102: 参数错误或获取数据失败
 * - 1: 成功
 * 
 * @author Coke
 * @version 2.0
 * @date 2025-12-31
 */

@header("Content-type: application/json;charset=utf-8");

$id = $_GET['id'] ?? '';

if(empty($id)){
    echo json_encode(["code"=>102,"auth"=>"内部API数据接口！","msg"=>"提示：缺少ID参数"], JSON_UNESCAPED_UNICODE);
    exit;
}

// 获取豆瓣页面
$url = 'https://movie.douban.com/subject/'.$id.'/';
$data = geturl($url);

if(empty($data)){
    echo json_encode(["code"=>102,"auth"=>"内部API数据接口！","msg"=>"提示：获取数据失败"], JSON_UNESCAPED_UNICODE);
    exit;
}

// 解析数据
$info = [];

// 标题 - 从 <i>标签中提取
preg_match('/<i>(.*?)的剧情简介<\/i>/', $data, $title_match);
if(!empty($title_match[1])){
    $info['vod_name'] = trim($title_match[1]);
} else {
    // 备用方案：从 v:itemreviewed 提取
    preg_match('/<span property="v:itemreviewed">(.*?)<\/span>/', $data, $title_match2);
    $info['vod_name'] = !empty($title_match2[1]) ? trim($title_match2[1]) : '';
}

// 完整标题（包含英文名）
preg_match('/<span property="v:itemreviewed">(.*?)<\/span>/', $data, $full_title);
$full_title_text = !empty($full_title[1]) ? trim($full_title[1]) : '';

// 年份
preg_match('/<span class="year">\((.*?)\)<\/span>/', $data, $year_match);
$info['vod_year'] = !empty($year_match[1]) ? $year_match[1] : '内详';

// 评分
preg_match('/<strong class="ll rating_num" property="v:average">(.*?)<\/strong>/', $data, $score_match);
$info['vod_score'] = !empty($score_match[1]) ? $score_match[1] : rand(1,4).'.'.rand(0,9);
$info['vod_douban_score'] = $info['vod_score'];

// 海报图片
preg_match('/"image": "https:\/\/(.*?)"/', $data, $pic_match);
if(!empty($pic_match[1])){
    $i = rand(0, 2);
    $info['vod_pic'] = "https://i$i.wp.com/".$pic_match[1];
} else {
    $info['vod_pic'] = '';
}

// 导演
preg_match('/<span class=\'pl\'>导演<\/span>: <span class=\'attrs\'>(.*?)<\/span><\/span>/', $data, $director_match);
if(!empty($director_match[1])){
    $info['vod_director'] = strip_tags($director_match[1]);
} else {
    $info['vod_director'] = '内详';
}

// 编剧
preg_match('/<span class=\'pl\'>编剧<\/span>: <span class=\'attrs\'>(.*?)<\/span><\/span>/', $data, $writer_match);
if(!empty($writer_match[1])){
    $info['vod_writer'] = strip_tags($writer_match[1]);
} else {
    $info['vod_writer'] = '内详';
}

// 主演
preg_match('/<span class=\'pl\'>主演<\/span>: <span class=\'attrs\'>(.*?)<\/span><\/span>/', $data, $actor_match);
if(!empty($actor_match[1])){
    $info['vod_actor'] = strip_tags($actor_match[1]);
} else {
    $info['vod_actor'] = '内详';
}

// 类型
preg_match_all('/<span property="v:genre">(.*?)<\/span>/', $data, $genre_matches);
$info['vod_class'] = !empty($genre_matches[1]) ? implode(' / ', $genre_matches[1]) : '';

// 制片国家/地区
preg_match('/<span class="pl">制片国家\/地区:<\/span> (.*?)<br\/>/', $data, $area_match);
$info['vod_area'] = !empty($area_match[1]) ? trim(strip_tags($area_match[1])) : '';

// 语言
preg_match('/<span class="pl">语言:<\/span> (.*?)<br\/>/', $data, $lang_match);
$info['vod_lang'] = !empty($lang_match[1]) ? trim(strip_tags($lang_match[1])) : '';

// 又名
preg_match('/<span class="pl">又名:<\/span> (.*?)<br\/>/', $data, $sub_match);
$info['vod_sub'] = !empty($sub_match[1]) ? trim(strip_tags($sub_match[1])) : $full_title_text;

// 判断是电影还是电视剧
$is_tv = strpos($data, '首播:') !== false;

if($is_tv){
    // 电视剧
    // 首播日期
    preg_match('/<span class="pl">首播:<\/span> <span property="v:initialReleaseDate"[^>]*>(.*?)<\/span>/', $data, $pubdate_match);
    $info['vod_pubdate'] = !empty($pubdate_match[1]) ? trim(strip_tags($pubdate_match[1])) : '';
    
    // 集数
    preg_match('/<span class="pl">集数:<\/span> (.*?)<br\/>/', $data, $total_match);
    $info['vod_total'] = !empty($total_match[1]) ? trim(strip_tags($total_match[1])) : '';
    
    // 单集片长
    preg_match('/<span class="pl">单集片长:<\/span> (.*?)<br\/>/', $data, $duration_match);
    $info['vod_duration'] = !empty($duration_match[1]) ? trim(strip_tags($duration_match[1])) : '';
    
    $info['vod_remarks'] = '总集数'.$info['vod_total'];
} else {
    // 电影
    // 上映日期
    preg_match('/<span class="pl">上映日期:<\/span> (.*?)<br\/>/', $data, $pubdate_match);
    if(!empty($pubdate_match[1])){
        $info['vod_pubdate'] = trim(strip_tags($pubdate_match[1]));
    } else {
        $info['vod_pubdate'] = '';
    }
    
    // 片长
    preg_match('/<span property="v:runtime" content="(.*?)"/', $data, $duration_match);
    $info['vod_duration'] = !empty($duration_match[1]) ? $duration_match[1] : '';
    
    $info['vod_total'] = '';
    
    // 备注
    if(strpos($info['vod_area'], '中国') !== false || strpos($info['vod_area'], '台湾') !== false){
        $info['vod_remarks'] = '高清国语';
    } else {
        $info['vod_remarks'] = '高清中字';
    }
}

// 简介
preg_match('/<span property="v:summary"[^>]*>(.*?)<\/span>/s', $data, $content_match);
if(!empty($content_match[1])){
    $content = strip_tags($content_match[1]);
    // 清理多余的空白字符和换行
    $content = preg_replace('/\s+/', ' ', $content);
    $content = preg_replace('/　+/', '', $content); // 移除全角空格
    $info['vod_content'] = trim($content);
} else {
    // 备用方案
    preg_match('/<span class="all hidden">(.*?)<\/span>/s', $data, $content_match2);
    if(!empty($content_match2[1])){
        $content = strip_tags($content_match2[1]);
        $content = preg_replace('/\s+/', ' ', $content);
        $content = preg_replace('/　+/', '', $content);
        $info['vod_content'] = trim($content);
    } else {
        $info['vod_content'] = '内详';
    }
}

// 豆瓣链接
preg_match('/data-url="(.*?)"/', $data, $reurl_match);
$info['vod_reurl'] = !empty($reurl_match[1]) ? $reurl_match[1] : $url;

// 其他字段
$info['vod_serial'] = '';
$info['vod_isend'] = 1;
$info['vod_tag'] = '';
$info['vod_score_num'] = rand(100,1000);
$info['vod_score_all'] = rand(200,500);
$info['vod_author'] = '';
$info['vod_douban_id'] = $id;
$info['vod_state'] = ''; // 资源类别

// 检查是否成功获取到名称
if(empty($info['vod_name'])){
    echo json_encode(["code"=>102,"auth"=>"内部API数据接口！","msg"=>"提示：解析失败"], JSON_UNESCAPED_UNICODE);
} else {
    $result = [
        'code' => 1,
        'auth' => '内部API数据接口！',
        'msg' => '提示：成功',
        'data' => $info
    ];
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
}

// 获取URL内容的函数
function geturl($url){
    if(function_exists('curl_init')){
        $ch = curl_init();
        $timeout = 30;
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer: https://www.douban.com',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: zh-CN,zh;q=0.9'
        ]);
        $handles = curl_exec($ch);
        curl_close($ch);
    } else {
        $handles = @file_get_contents($url);
    }
    return $handles;
}
?>
