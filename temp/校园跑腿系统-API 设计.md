# 校园跑腿系统 - API 接口设计

**版本**: V1.0  
**创建时间**: 2026-03-15  
**基础 URL**: `https://api.yourdomain.com/v1`

---

## 📡 通用规范

### 请求格式
- Content-Type: `application/json`
- 认证方式：Header 中携带 `Authorization: Bearer <token>`

### 响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误码
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录/Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
| 1001 | 订单状态不允许此操作 |
| 1002 | 余额不足 |
| 1003 | 骑手认证未完成 |

---

## 🔐 认证模块

### POST /auth/wechat-login
**微信登录**

**请求**:
```json
{
  "code": "微信登录 code"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "openid": "xxx",
      "nickname": "xxx",
      "avatar": "xxx",
      "role": 1,
      "rider_verified": 0
    }
  }
}
```

### POST /auth/bind-phone
**绑定手机号**

**请求**:
```json
{
  "phone": "13800138000",
  "smsCode": "123456"
}
```

---

## 👤 用户模块

### GET /user/profile
**获取个人信息**

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "nickname": "小明",
    "avatar": "https://...",
    "phone": "138****0000",
    "role": 1,
    "balance": 0.00,
    "rider_verified": 0
  }
}
```

### PUT /user/profile
**更新个人信息**

**请求**:
```json
{
  "nickname": "新昵称",
  "avatar": "新头像 URL"
}
```

### POST /rider/apply
**申请成为骑手**

**请求**:
```json
{
  "student_id": "20210001",
  "student_name": "张三",
  "id_card": "身份证（可选）",
  "deposit": 50.00
}
```

---

## 📦 订单模块（客户端）

### POST /orders
**创建订单**

**请求**:
```json
{
  "type": 1,
  "title": "帮取快递",
  "description": "菜鸟驿站 3 号柜",
  "pickup_address": "菜鸟驿站南区",
  "pickup_phone": "13800138000",
  "delivery_address": "宿舍楼 A 栋 301",
  "delivery_phone": "13900139000",
  "expected_time": "2026-03-16 14:00:00",
  "reward": 5.00,
  "weight": "小件",
  "images": ["url1", "url2"]
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "order_no": "ER202603150001",
    "status": 0,
    "reward": 5.00,
    "platform_fee": 0.25,
    "total": 5.25
  }
}
```

### GET /orders
**订单列表**

**参数**:
- status: 订单状态筛选（可选）
- page: 页码（默认 1）
- page_size: 每页数量（默认 10）

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "ER202603150001",
        "title": "帮取快递",
        "reward": 5.00,
        "status": 0,
        "created_at": "2026-03-15 10:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 10
  }
}
```

### GET /orders/:id
**订单详情**

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "order_no": "ER202603150001",
    "type": 1,
    "title": "帮取快递",
    "description": "菜鸟驿站 3 号柜",
    "pickup_address": "菜鸟驿站南区",
    "delivery_address": "宿舍楼 A 栋 301",
    "reward": 5.00,
    "platform_fee": 0.25,
    "status": 0,
    "rider": null,
    "created_at": "2026-03-15 10:00:00"
  }
}
```

### POST /orders/:id/cancel
**取消订单**

**请求**:
```json
{
  "reason": "不需要了"
}
```

### POST /orders/:id/confirm
**确认收货**

---

## 🚴 订单模块（骑手端）

### GET /rider/orders
**可接订单列表**

**参数**:
- type: 订单类型筛选（可选）
- min_reward: 最低悬赏（可选）
- page: 页码
- page_size: 每页数量

**响应**:
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "order_no": "ER202603150001",
        "title": "帮取快递",
        "type": 1,
        "pickup_address": "菜鸟驿站南区",
        "delivery_address": "宿舍楼 A 栋 301",
        "reward": 5.00,
        "weight": "小件",
        "created_at": "2026-03-15 10:00:00"
      }
    ],
    "total": 20
  }
}
```

### POST /rider/orders/:id/accept
**接单**

**响应**:
```json
{
  "code": 200,
  "message": "接单成功"
}
```

### POST /rider/orders/:id/pickup
**确认取货**

### POST /rider/orders/:id/deliver
**确认送达**

### GET /rider/stats
**骑手数据统计**

**响应**:
```json
{
  "code": 200,
  "data": {
    "total_orders": 50,
    "total_income": 250.00,
    "balance": 180.00,
    "rating": 4.8,
    "today_orders": 5,
    "today_income": 25.00
  }
}
```

---

## 💰 支付模块

### POST /payments/wechat
**发起微信支付**

**请求**:
```json
{
  "order_id": 1,
  "type": 1
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "payment_no": "PAY202603150001",
    "wechat_pay": {
      "appId": "wx123...",
      "timeStamp": "1234567890",
      "nonceStr": "xxx",
      "package": "prepay_id=xxx",
      "signType": "RSA",
      "paySign": "xxx"
    }
  }
}
```

### POST /payments/notify
**支付回调**（微信服务端调用）

---

## 💸 提现模块（骑手）

### GET /rider/withdrawals
**提现记录列表**

### POST /rider/withdrawals
**申请提现**

**请求**:
```json
{
  "amount": 100.00,
  "channel": 1,
  "account": "wx_openid_xxx",
  "real_name": "张三"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "withdrawal_no": "WD202603150001",
    "amount": 100.00,
    "fee": 1.00,
    "actual_amount": 99.00
  }
}
```

---

## ⭐ 评价模块

### POST /orders/:id/review
**提交评价**

**请求**:
```json
{
  "rating": 5,
  "content": "骑手很准时，态度好！",
  "images": ["url1", "url2"]
}
```

### GET /rider/:id/reviews
**骑手评价列表**

---

## 🔔 消息推送

### GET /notifications
**消息列表**

### WebSocket /ws
**实时消息推送**

推送事件:
- `order_accepted`: 订单被接单
- `order_picked`: 骑手已取货
- `order_delivered`: 订单已送达
- `new_order`: 新订单（骑手端）

---

## 📊 后台管理模块

### GET /admin/orders
**订单管理列表**

**参数**:
- status: 状态筛选
- start_date: 开始日期
- end_date: 结束日期

### POST /admin/orders/:id/refund
**订单退款**

### GET /admin/users
**用户管理列表**

### PUT /admin/users/:id/status
**禁用/启用用户**

### GET /admin/withdrawals
**提现审核列表**

### POST /admin/withdrawals/:id/approve
**审核通过**

### POST /admin/withdrawals/:id/reject
**审核拒绝**

### GET /admin/stats
**平台数据统计**

**响应**:
```json
{
  "code": 200,
  "data": {
    "today": {
      "orders": 50,
      "gmv": 250.00,
      "fee_income": 12.50,
      "new_users": 10,
      "new_riders": 2
    },
    "total": {
      "users": 500,
      "riders": 50,
      "orders": 2000,
      "gmv": 10000.00
    }
  }
}
```

---

## 📝 附录：数据字典

### 订单类型 (type)
| 值 | 说明 |
|----|------|
| 1 | 取物 |
| 2 | 送餐 |
| 3 | 代购 |
| 4 | 其他 |

### 订单状态 (status)
| 值 | 说明 |
|----|------|
| 0 | 待接单 |
| 1 | 已接单 |
| 2 | 已取货 |
| 3 | 已完成 |
| 4 | 已确认 |
| 5 | 已取消 |
| 6 | 已退款 |
| -1 | 异常/纠纷 |

### 用户角色 (role)
| 值 | 说明 |
|----|------|
| 1 | 普通用户 |
| 2 | 骑手 |
| 3 | 管理员 |

---

*最后更新：2026-03-15*
