# PetTag ID 上线版项目

这是宠物防丢吊牌系统的第一版代码。

## 功能

- 吊牌激活
- 宠物资料编辑
- 公开扫码页面
- 路人发送当前位置
- 邮件通知主人
- 管理员批量生成 Tag ID 和二维码

## 需要注册的服务

1. Supabase：数据库
2. Vercel：部署网站
3. Resend：发送邮件
4. 域名：建议使用 `tag.yourdomain.com`

## 本地准备

安装 Node.js 后，在项目目录运行：

```bash
npm install
```

复制环境变量：

```bash
cp .env.example .env.local
```

填写：

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
EMAIL_FROM
```

启动：

```bash
npm run dev
```

## Supabase 设置

1. 打开 Supabase 项目。
2. 进入 SQL Editor。
3. 粘贴 `supabase/schema.sql`。
4. 点击 Run。

## 页面

```text
/activate
/dashboard
/dashboard/pets/[tagId]/edit
/pet/[tagId]
/admin/tags
```

## 第一版测试数据

```text
Tag ID: 99999993
Activation Code: ABCD
```

## 上线到 Vercel

1. 把项目上传到 GitHub。
2. Vercel 导入 GitHub 项目。
3. 在 Vercel 添加环境变量。
4. 部署。
5. 把域名 `tag.yourdomain.com` 绑定到 Vercel。

## 正式上线前必须补的安全项

第一版为了方便测试，管理员页面和邮箱后台入口较简单。正式上线前需要补：

```text
管理员登录
真实用户密码登录或验证码登录
Activation Code 哈希存储
图片上传到 Supabase Storage
接口限流
隐私政策
服务条款
删除资料入口
```
