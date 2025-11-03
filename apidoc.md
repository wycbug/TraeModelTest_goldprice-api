# 今日黄金价格API

免费

获取最新的黄金价格以及各种黄金的详细信息

## 接口信息

**接口地址：** `https://api.pearktrue.cn/api/goldprice/`

**请求方式：** GET

**返回格式：** JSON

## 返回结果

| 字段名 | 说明 | 类型 |
|--------|------|------|
| code | 状态码 | 整数 |
| msg | 状态类型 | 字符串 |
| time | 获取时间 | 字符串 |
| price | 今日价格 | 字符串 |
| data | 返回数据 | 数组 |
| api_source | API来源 | 字符串 |
| id | 序号 | 字符串 |
| dir | 黄金目录 | 字符串 |
| title | 黄金名 | 字符串 |
| changepercent | 涨跌幅 | 字符串 |
| maxprice | 最高价 | 数字 |
| minprice | 最低价 | 数字 |
| buyprice | 最高买入价 | 数字 |
| recycleprice | 最低卖出价 | 数字 |
| date | 日期 | 字符串 |

## 调用示例

```bash
GET https://api.pearktrue.cn/api/goldprice/
```

## 响应示例

```json
{
  "code": 200,
  "msg": "获取成功",
  "time": "2025-11-06 14:12:50",
  "price": "913.76",
  "data": [
    {
      "id": "1",
      "dir": "SH_AuTD",
      "title": "黄金（T+D）",
      "changepercent": "+0.67",
      "maxprice": 914.56,
      "minprice": 908.5,
      "buyprice": 913.8,
      "recycleprice": 913.89,
      "date": "2025-11-06"
    },
    {
      "id": "2",
      "dir": "Au",
      "title": "黄金",
      "changepercent": "+1.17",
      "maxprice": 916.94,
      "minprice": 906.37,
      "buyprice": 912.16,
      "recycleprice": 914.65,
      "date": "2025-11-06"
    },
    {
      "id": "3",
      "dir": "Pt",
      "title": "铂金",
      "changepercent": "+2.73",
      "maxprice": 417.5,
      "minprice": 406.4,
      "buyprice": 412.8,
      "recycleprice": 416.8,
      "date": "2025-11-06"
    }
  ],
  "api_source": "官方API网:https://api.pearktrue.cn/"
}
```

## 调用统计

- **总调用次数：** 919,657
- **今日调用：** 17,928
- **本周调用：** 240,932

---

*API来源：官方API网 https://api.pearktrue.cn/*
