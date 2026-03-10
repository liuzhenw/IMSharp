# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

IMSharp 是一个基于 .NET 10 的即时通讯系统,支持一对一私聊和群聊功能。技术栈包括 ASP.NET Core Web API、SignalR (实时通讯)、Entity Framework Core + PostgreSQL、JWT 认证和 OAuth 2.0。

## 架构设计

项目采用清晰的分层架构:

### 1. IMSharp.Domain (领域层)
- **BaseEntity**: 所有实体的基类,使用 `Guid.CreateVersion7()` 生成 ID,使用 `DateTimeOffset` 处理时间
- **实体类**: User, PrivateMessage, GroupMessage, Friendship, FriendRequest, Group, GroupMember, GroupJoinRequest, RefreshToken
- **MessageType 枚举**: 通用消息类型 (Text, Image, File, System),被 PrivateMessage 和 GroupMessage 共享
- **自定义异常**: NotFoundException, UnauthorizedException, BusinessException

### 2. IMSharp.Infrastructure (基础设施层)
- **ApplicationDbContext**: EF Core 数据库上下文
- **Configurations**: 使用 `IEntityTypeConfiguration<T>` 配置实体映射,枚举字段使用 `.HasConversion<string>()` 转换为字符串存储
- **Repository 模式**: 泛型 `IRepository<T>` + 特定仓储接口 (IUserRepository, IPrivateMessageRepository, IGroupRepository 等)
- **Storage**: 文件存储抽象 (IStorageProvider),默认实现 LocalStorageProvider

### 3. IMSharp.Core (应用层)
- **Services**: 业务逻辑服务 (AuthService, UserService, FriendService, PrivateMessageService, GroupService)
- **DTOs**: 数据传输对象,使用 C# record 类型
- **Mappers**: 使用 Riok.Mapperly 进行对象映射,通过 `[Mapper]` 特性和 partial 类自动生成映射代码
- **Validators**: 使用 FluentValidation 进行输入验证
- **Authentication**: JWT 服务 (IJwtService) 和 OAuth 提供商 (IOAuthProvider)
- **ConnectionManager**: 管理 SignalR 连接映射 (userId -> connectionId)

### 4. IMSharp.Api (表示层)
- **Controllers**: RESTful API 控制器
- **Hubs**: SignalR Hub (ChatHub) 处理实时通讯
- **Middleware**: 全局异常处理 (GlobalExceptionMiddleware)
- **Filters**: Swagger 安全需求过滤器

## 常用命令

### 构建和运行
```bash
# 编译项目
dotnet build src/IMSharp.Api/IMSharp.Api.csproj

# 运行 API (默认端口 5185)
dotnet run --project src/IMSharp.Api

# 清理构建输出
dotnet clean src/IMSharp.Api/IMSharp.Api.csproj
```

### 数据库迁移
```bash
# 创建新迁移
dotnet ef migrations add <MigrationName> \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api

# 应用迁移到数据库
dotnet ef database update \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api

# 列出所有迁移
dotnet ef migrations list \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api

# 回滚到指定迁移
dotnet ef database update <MigrationName> \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api

# 删除最后一个迁移 (未应用到数据库)
dotnet ef migrations remove \
  --project src/IMSharp.Infrastructure \
  --startup-project src/IMSharp.Api
```

### Docker 数据库操作
PostgreSQL 运行在 Docker 容器中,容器名为 `pgsql`:

```bash
# 连接到数据库
docker exec pgsql psql -U postgres -d im_sharp

# 查看表结构
docker exec pgsql psql -U postgres -d im_sharp -c "\d <table_name>"

# 执行 SQL 查询
docker exec pgsql psql -U postgres -d im_sharp -c "SELECT * FROM users LIMIT 5;"
```

## 关键设计模式

### 1. 时间处理
- **始终使用 `DateTimeOffset`** 而非 `DateTime`,以支持时区信息
- BaseEntity 的 CreatedAt 默认值为 `DateTimeOffset.UtcNow`

### 2. 枚举存储
- 枚举字段在数据库中存储为字符串,便于调试和扩展
- 配置示例: `builder.Property(x => x.Type).HasConversion<string>()`

### 3. 对象映射
- 使用 Riok.Mapperly 自动生成映射代码
- Mapper 类使用 `[Mapper]` 特性和 `partial` 关键字
- 简单映射使用 `public partial TDto ToDto(TEntity entity);`
- 复杂映射需要手动实现方法体

### 4. 验证
- 使用 FluentValidation 进行输入验证
- 每个 DTO 对应一个 Validator 类
- 验证规则示例: `RuleFor(x => x.Field).NotEmpty().MaximumLength(100)`

### 5. 依赖注入
- Repository 使用 Scoped 生命周期
- Service 使用 Scoped 生命周期
- JWT/OAuth 服务使用 Singleton 生命周期
- ConnectionManager 使用 Singleton 生命周期

### 6. 消息类型系统
- PrivateMessage 和 GroupMessage 共享通用的 MessageType 枚举
- MessageType 定义在独立文件 `src/IMSharp.Domain/Entities/MessageType.cs`
- 支持的类型: Text, Image, File, System
- 默认值为 Text,确保向后兼容

## 数据库配置

连接字符串在 `src/IMSharp.Api/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=im_sharp;User ID=postgres;Password=P@ssword;"
  }
}
```

## API 访问

- API 基础 URL: `http://localhost:5185`
- Swagger UI: `http://localhost:5185/swagger`
- 认证方式: JWT Bearer Token
- 请求头: `Authorization: Bearer <token>`

## 重要约定

1. **实体 ID**: 使用 `Guid.CreateVersion7()` 生成,提供时间排序特性
2. **外键约束**: 使用 `OnDelete(DeleteBehavior.Restrict)` 防止级联删除
3. **索引命名**: 使用 `HasDatabaseName("idx_<table>_<columns>")` 显式命名
4. **表命名**: 使用小写下划线命名 (如 `private_messages`, `group_members`)
5. **枚举验证**: 使用 `Enum.TryParse<T>()` 解析字符串,失败时使用默认值
6. **好友验证**: 发送私聊消息前必须验证好友关系
7. **群组权限**: 群主和管理员有特殊权限 (踢人、解散群等)

## SignalR 实时通讯

ChatHub 提供以下方法:
- `SendPrivateMessage`: 发送私聊消息
- `SendGroupMessage`: 发送群聊消息
- `JoinGroup`: 加入群组
- `LeaveGroup`: 离开群组

ConnectionManager 维护 userId 到 connectionId 的映射,用于推送消息到特定用户。

## 重要说明
开发环境 PostgreSQL 数据库运行在 docker 容器中, 容器名称为 pgsql;

