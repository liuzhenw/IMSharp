using System.Text;
using System.Text.Json.Serialization;
using IMSharp.Api.BackgroundServices;
using IMSharp.Api.Configuration;
using IMSharp.Api.Hubs;
using IMSharp.Api.Middleware;
using IMSharp.Core.Authentication;
using IMSharp.Core.Services;
using IMSharp.Infrastructure.Data;
using IMSharp.Infrastructure.Repositories;
using IMSharp.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, config) =>
    config.ReadFrom.Configuration(ctx.Configuration));

// Add services
builder.Services.AddControllers();
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.PayloadSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// Configure DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// Register Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IFriendRepository, FriendRepository>();
builder.Services.AddScoped<IPrivateMessageRepository, PrivateMessageRepository>();
builder.Services.AddScoped<IGroupRepository, GroupRepository>();

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFriendService, FriendService>();
builder.Services.AddScoped<IPrivateMessageService, PrivateMessageService>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddSingleton<IConnectionManager, ConnectionManager>();
builder.Services.AddScoped<INotificationService, IMSharp.Api.Services.NotificationService>();

// Register Authentication
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddHttpClient<IOAuthProvider, GenericOAuthProvider>();

// Register Storage
builder.Services.AddSingleton<IStorageProvider, LocalStorageProvider>();

// Configure MessageCleanup Options
builder.Services.Configure<MessageCleanupOptions>(builder.Configuration.GetSection("MessageCleanup"));

// Configure DatabaseMigration Options
builder.Services.Configure<DatabaseMigrationOptions>(builder.Configuration.GetSection("DatabaseMigration"));

// Register Background Services
builder.Services.AddHostedService<MessageCleanupService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret is not configured");
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
        // Configure JWT for SignalR
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "IMSharp API",
        Version = "v1",
        Description = "即时通讯系统 API"
    });

    // 添加 JWT Bearer 认证
    c.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("bearer", document)] = []
    });
});

// Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
var embedOrigins = builder.Configuration.GetSection("Embed:AllowedOrigins").Get<string[]>() ?? [];
var allOrigins = allowedOrigins.Concat(embedOrigins).Distinct().ToArray();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // SignalR 必需
    });
});

var app = builder.Build();

// 自动执行数据库迁移
await MigrateDatabaseAsync(app);

// Configure middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();

app.UseCors();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<ChatHub>("/hubs/chat");
app.MapControllers();

app.Run();

static async Task MigrateDatabaseAsync(WebApplication app)
{
    var migrationOptions = app.Configuration.GetSection("DatabaseMigration").Get<DatabaseMigrationOptions>()
        ?? new DatabaseMigrationOptions();

    if (!migrationOptions.AutoMigrateOnStartup)
    {
        app.Logger.LogInformation("数据库自动迁移已禁用");
        return;
    }

    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("开始检查数据库迁移状态");

        var pendingMigrations = (await context.Database.GetPendingMigrationsAsync()).ToList();
        var pendingCount = pendingMigrations.Count;

        if (pendingCount == 0)
        {
            logger.LogInformation("数据库已是最新版本,无需迁移");
            return;
        }

        logger.LogInformation("检测到 {Count} 个待应用的迁移: {Migrations}",
            pendingCount, string.Join(", ", pendingMigrations));

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        // 设置超时时间
        if (migrationOptions.TimeoutSeconds > 0)
        {
            context.Database.SetCommandTimeout(TimeSpan.FromSeconds(migrationOptions.TimeoutSeconds));
        }

        // 执行迁移
        await context.Database.MigrateAsync();

        stopwatch.Stop();
        logger.LogInformation("数据库迁移成功完成,耗时: {Elapsed}ms", stopwatch.ElapsedMilliseconds);
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "数据库迁移失败: {Message}", ex.Message);

        if (migrationOptions.StopApplicationOnFailure)
        {
            throw new InvalidOperationException("数据库迁移失败,应用程序将终止。请检查数据库连接和迁移脚本。", ex);
        }

        logger.LogWarning("数据库迁移失败,但应用程序将继续启动");
    }
}
