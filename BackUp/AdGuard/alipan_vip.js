var obj = JSON.parse($response.body);

// 修改字段
obj.identity = "vip";
obj.autoRenew = true;

if (obj.vipList && obj.vipList.length > 0) {
    obj.vipList[0].code = "svip.8t";
    obj.vipList[0].name = "超级会员";
    obj.vipList[0].expire = 3313497600000; // 2075-01-01
}

$done({ body: JSON.stringify(obj) });
