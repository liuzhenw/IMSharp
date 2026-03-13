# IMSharp

一个基于 .NET 10 的现代化即时通讯系统,支持一对一私聊和群组聊天功能。

## 功能特性

- **用户认证** - OAuth 2.0 + JWT 双重认证机制
- **私聊功能** - 实时消息推送、已读状态、好友管理
- **群聊功能** - 群组管理、成员管理、权限控制
- **实时通讯** - 基于 SignalR 的 WebSocket 连接
- **文件管理** - 图片上传、媒体文件管理
- **消息管理** - 自动清理过期消息、本地缓存
- **数据库自动迁移** - 应用启动时自动应用数据库迁移

## 技术栈

### 后端技术

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | .NET 10 | ASP.NET Core Web API |
| 实时通讯 | SignalR | WebSocket 实时消息推送 |
| 数据库 | PostgreSQL | 关系型数据库 |
| ORM | Entity Framework Core | 数据访问层 |
| 认证 | JWT + OAuth 2.0 | 身份认证和授权 |
| 对象映射 | Riok.Mapperly | 编译时对象映射 |
| 验证 | FluentValidation | 输入验证 |
| 日志 | Serilog | 结构化日志 |

### 前端技术

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 | 3.5.29 |
| 语言 | TypeScript | 5.9.3 |
| 构建工具 | Vite | 7.3.1 |
| 样式 | Tailwind CSS | 3.4.19 |
| 状态管理 | Pinia | 3.0.4 |
| 路由 | Vue Router | 5.0.3 |
| HTTP 客户端 | Axios | 1.13.6 |
| 实时通讯 | @microsoft/signalr | 10.0.0 |
| 本地存储 | Dexie (IndexedDB) | 4.3.0 |

## 项目架构

项目采用清晰的分层架构设计:

```
dotnet/
├── src/
│   ├── IMSharp.Domain/          # 领域层
│   │   ├── Entities/            # 实体类
│   │   └── Exceptions/          # 自定义异常
│   ├── IMSharp.Infrastructure/  # 基础设施层
│   │   ├── Data/                # 数据库上下文和配置
│   │   ├── Repositories/        # 仓储实现
│   │   └── Storage/             # 文件存储
│   ├── IMSharp.Core/            # 应用层
│   │   ├── Services/            # 业务逻辑服务
│   │   ├── DTOs/                # 数据传输对象
│   │   ├── Mappers/             # 对象映射
│   │   ├── Validators/          # 输入验证
│   │   └── Authentication/      # 认证服务
│   └── IMSharp.Api/             # 表示层
│       ├── Controllers/         # API 控制器
│       ├── Hubs/                # SignalR Hub
│       └── Middleware/          # 中间件
└── tests/                       # 测试项目
```

### 架构特点

- **清晰的分层架构** - Domain、Infrastructure、Core、Api 四层分离
- **Repository 模式** - 数据访问抽象
- **Guid.CreateVersion7()** - 时间排序的 ID 生成
- **DateTimeOffset** - 完整的时区支持
- **枚举字符串存储** - 便于调试和扩展
- **Riok.Mapperly** - 编译时对象映射,零反射开销

## 快速开始

### 环境要求

- **.NET SDK 10.0** - [下载地址](https://dotnet.microsoft.com/download)
- **PostgreSQL** - 推荐使用 Docker
- **Node.js >= 20.19.0** - 前端开发需要
- **pnpm** - 前端包管理器

### 后端启动

#### 1. 启动数据库

```bash
docker run -d --name pgsql \
  -e POSTGRES_PASSWORD=P@ssword \
  -e POSTGRES_DB=im_sharp \
  -p 5432:5432 \
  postgres:latest
```

#### 2. 运行后端服务

```bash
cd dotnet
dotnet run --project src/IMSharp.Api
```

应用会自动执行数据库迁移(如果配置了 `DatabaseMigration.AutoMigrateOnStartup = true`)。

#### 3. 访问 API

- **API 基础 URL**: http://localhost:5185
- **Swagger 文档**: http://localhost:5185/swagger
- **SignalR Hub**: http://localhost:5185/hubs/chat

### 前端启动

```bash
cd nodejs/im-sharp-app
pnpm install
pnpm dev
```

前端应用将在 http://localhost:5173 启动。

## 开发指南

### 数据库迁移

#### 创建新迁移

```bash
dotnet ef migrations add <MigrationName> \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api
```

#### 应用迁移

```bash
dotnet ef database update \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api
```

#### 列出所有迁移

```bash
dotnet ef migrations list \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api
```

#### 回滚迁移

```bash
dotnet ef database update <MigrationName> \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api
```

### 配置说明

主要配置文件: `src/IMSharp.Api/appsettings.json`

#### 数据库连接

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=im_sharp;User ID=postgres;Password=P@ssword;"
  }
}
```

#### JWT 配置

```json
{
  "Jwt": {
    "Secret": "your-secret-key",
    "Issuer": "IMSharp",
    "Audience": "IMSharp.Client",
    "ExpirationMinutes": 60,
    "RefreshExpirationDays": 7
  }
}
```

#### OAuth 配置

```json
{
  "OAuth": {
    "Provider": "LocalOAuth",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "AuthorizationEndpoint": "http://localhost:5001/connect/authorize",
    "TokenEndpoint": "http://localhost:5001/connect/token",
    "UserInfoEndpoint": "http://localhost:5001/connect/userinfo"
  }
}
```

#### 文件存储配置

```json
{
  "Storage": {
    "Provider": "Local",
    "Local": {
      "BaseUrl": "http://localhost:5185",
      "RootPath": "wwwroot/uploads",
      "MaxFileSizeMB": 10,
      "AllowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    }
  }
}
```

#### 消息自动清理配置

```json
{
  "MessageCleanup": {
    "Enabled": true,
    "RetentionDays": 7,
    "ScheduleTime": "00:00:00"
  }
}
```

#### 数据库自动迁移配置

```json
{
  "DatabaseMigration": {
    "AutoMigrateOnStartup": true,
    "StopApplicationOnFailure": true,
    "TimeoutSeconds": 300
  }
}
```

**配置说明**:
- `AutoMigrateOnStartup`: 应用启动时自动应用数据库迁移
- `StopApplicationOnFailure`: 迁移失败时停止应用启动
- `TimeoutSeconds`: 迁移操作超时时间

> **注意**: 生产环境建议设置 `AutoMigrateOnStartup = false`,手动执行数据库迁移。

### Docker 数据库操作

```bash
# 连接到数据库
docker exec -it pgsql psql -U postgres -d im_sharp

# 查看表结构
docker exec pgsql psql -U postgres -d im_sharp -c "\d users"

# 执行 SQL 查询
docker exec pgsql psql -U postgres -d im_sharp -c "SELECT * FROM users LIMIT 5;"
```

## API 文档

### 认证方式

所有需要认证的 API 请求都需要在 Header 中携带 JWT Token:

```
Authorization: Bearer <your-jwt-token>
```

### 主要 API 端点

#### 认证相关

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新 Token
- `POST /api/auth/logout` - 用户登出

#### 用户相关

- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户信息
- `POST /api/users/avatar` - 上传头像

#### 好友相关

- `GET /api/friends` - 获取好友列表
- `POST /api/friends/requests` - 发送好友请求
- `PUT /api/friends/requests/{id}/accept` - 接受好友请求
- `DELETE /api/friends/{id}` - 删除好友

#### 私聊相关

- `GET /api/private-messages` - 获取私聊消息列表
- `POST /api/private-messages` - 发送私聊消息
- `PUT /api/private-messages/{id}/read` - 标记消息已读

#### 群组相关

- `GET /api/groups` - 获取群组列表
- `POST /api/groups` - 创建群组
- `GET /api/groups/{id}` - 获取群组详情
- `PUT /api/groups/{id}` - 更新群组信息
- `DELETE /api/groups/{id}` - 解散群组
- `POST /api/groups/{id}/members` - 添加群成员
- `DELETE /api/groups/{id}/members/{userId}` - 移除群成员

#### 群聊相关

- `GET /api/group-messages` - 获取群聊消息列表
- `POST /api/group-messages` - 发送群聊消息

### SignalR 实时通讯

**Hub 端点**: `/hubs/chat`

**客户端方法** (发送到服务器):
- `SendPrivateMessage` - 发送私聊消息
- `SendGroupMessage` - 发送群聊消息
- `JoinGroup` - 加入群组
- `LeaveGroup` - 离开群组

**服务器方法** (接收自服务器):
- `ReceivePrivateMessage` - 接收私聊消息
- `ReceiveGroupMessage` - 接收群聊消息
- `UserStatusChanged` - 用户在线状态变化
- `FriendRequestReceived` - 收到好友请求

完整 API 文档请参考: [API_DOCUMENTATION.md](../nodejs/docs/API_DOCUMENTATION.md)

## 部署

### Docker 部署

#### 构建镜像

```bash
cd dotnet
docker build -t imsharp-api -f src/IMSharp.Api/Dockerfile .
```

#### 运行容器

```bash
docker run -d -p 8080:8080 \
  -e ConnectionStrings__Default="Host=your-db-host;Port=5432;Database=im_sharp;User ID=postgres;Password=your-password;" \
  -e Jwt__Secret="your-secret-key" \
  imsharp-api
```

### 生产环境注意事项

#### 安全配置

- [ ] 修改 JWT Secret 为强密码
- [ ] 配置 HTTPS
- [ ] 限制 CORS 允许的源
- [ ] 配置防火墙规则
- [ ] 使用环境变量存储敏感信息

#### 数据库配置

- [ ] 使用独立的数据库服务器
- [ ] 配置数据库备份策略
- [ ] 设置数据库连接池大小
- [ ] 关闭数据库自动迁移 (`AutoMigrateOnStartup = false`)

#### 性能优化

- [ ] 启用响应压缩
- [ ] 配置 Redis 缓存
- [ ] 使用 CDN 托管静态文件
- [ ] 配置负载均衡

#### 日志和监控

- [ ] 配置集中式日志收集
- [ ] 设置应用性能监控 (APM)
- [ ] 配置健康检查端点
- [ ] 设置告警规则

## 开发规范

### 代码风格

- 使用 C# 10+ 语法特性
- 遵循 .NET 命名约定
- 使用 `record` 类型定义 DTO
- 使用 `async/await` 处理异步操作

### 提交规范

遵循 Conventional Commits 规范:

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链更新
```

### 分支策略

- `main` - 主分支,保持稳定
- `develop` - 开发分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支

## 测试

### 运行测试

```bash
# 运行所有测试
dotnet test

# 运行特定项目的测试
dotnet test tests/IMSharp.Tests

# 生成测试覆盖率报告
dotnet test /p:CollectCoverage=true
```

## 常见问题

### 数据库连接失败

**问题**: 应用启动时提示数据库连接失败

**解决方案**:
1. 确认 PostgreSQL 容器正在运行: `docker ps | grep pgsql`
2. 检查连接字符串配置是否正确
3. 确认数据库已创建: `docker exec pgsql psql -U postgres -l`

### SignalR 连接问题

**问题**: 前端无法连接到 SignalR Hub

**解决方案**:
1. 确认后端服务正在运行
2. 检查 CORS 配置是否包含前端地址
3. 查看浏览器控制台的 WebSocket 错误信息
4. 确认 JWT Token 有效

### 跨域配置

**问题**: API 请求被 CORS 策略阻止

**解决方案**:
在 `appsettings.json` 中添加前端地址到 `Cors.AllowedOrigins`:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://your-frontend-domain.com"
    ]
  }
}
```

### Token 过期处理

**问题**: Token 过期后需要重新登录

**解决方案**:
前端已实现自动刷新机制,使用 `refreshToken` 自动获取新的 `accessToken`。如果 `refreshToken` 也过期,则需要重新登录。

## 贡献指南

欢迎贡献代码!请遵循以下步骤:

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发环境搭建

1. 克隆仓库
2. 安装依赖
3. 启动数据库
4. 运行后端服务
5. 运行前端应用

详细步骤请参考 [快速开始](#快速开始) 章节。

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

- **项目维护者**: [Your Name]
- **问题反馈**: [GitHub Issues](https://github.com/your-username/imsharp/issues)
- **邮箱**: your-email@example.com

## 相关文档

- [后端架构文档](CLAUDE.md)
- [前端开发指南](../nodejs/CLAUDE.md)
- [API 对接文档](../nodejs/docs/API_DOCUMENTATION.md)
- [API 迁移文档](API_MIGRATION.md)

---

**IMSharp** - 现代化即时通讯系统 | Built with ❤️ using .NET 10
