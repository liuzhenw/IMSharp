using System.Diagnostics;
using IMSharp.Api.Configuration;
using IMSharp.Infrastructure.Repositories;
using IMSharp.Infrastructure.Storage;
using Microsoft.Extensions.Options;

namespace IMSharp.Api.BackgroundServices;

public class MessageCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<MessageCleanupService> logger,
    IOptions<MessageCleanupOptions> options)
    : BackgroundService
{
    private readonly MessageCleanupOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            logger.LogInformation("消息自动清理功能已禁用");
            return;
        }

        logger.LogInformation("消息自动清理服务已启动,保留天数: {RetentionDays}, 执行时间: {ScheduleTime}",
            _options.RetentionDays, _options.ScheduleTime);

        var now = DateTimeOffset.Now;
        var scheduleTime = TimeOnly.Parse(_options.ScheduleTime);
        var nextRun = CalculateNextRunTime(now, scheduleTime);

        logger.LogInformation("下次清理时间: {NextRun}", nextRun);

        using var timer = new PeriodicTimer(TimeSpan.FromDays(1));

        // 首次延迟到指定时间
        var delay = nextRun - now;
        if (delay > TimeSpan.Zero)
        {
            await Task.Delay(delay, stoppingToken);
        }

        // 循环执行清理
        do
        {
            await CleanupMessagesAsync(stoppingToken);
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private DateTimeOffset CalculateNextRunTime(DateTimeOffset now, TimeOnly scheduleTime)
    {
        var today = DateOnly.FromDateTime(now.DateTime);
        var scheduledDateTime = today.ToDateTime(scheduleTime);
        var scheduledOffset = new DateTimeOffset(scheduledDateTime, now.Offset);

        if (scheduledOffset <= now)
        {
            // 如果今天的时间已过,则安排到明天
            scheduledOffset = scheduledOffset.AddDays(1);
        }

        return scheduledOffset;
    }

    private async Task CleanupMessagesAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var privateRepo = scope.ServiceProvider.GetRequiredService<IPrivateMessageRepository>();
        var groupRepo = scope.ServiceProvider.GetRequiredService<IGroupRepository>();
        var storageProvider = scope.ServiceProvider.GetRequiredService<IStorageProvider>();

        var cutoffTime = DateTimeOffset.UtcNow.AddDays(-_options.RetentionDays);
        var stopwatch = Stopwatch.StartNew();

        try
        {
            logger.LogInformation("消息清理任务开始执行,保留天数: {RetentionDays}, 截止时间: {CutoffTime}",
                _options.RetentionDays, cutoffTime);

            // 1. 删除数据库记录
            var privateCount = await privateRepo.DeleteOldMessagesAsync(cutoffTime, cancellationToken);
            var groupCount = await groupRepo.DeleteOldGroupMessagesAsync(cutoffTime, cancellationToken);

            // 2. 删除过期的文件目录
            var deletedDirs = await CleanupOldFilesAsync(storageProvider, cutoffTime, cancellationToken);

            stopwatch.Stop();
            logger.LogInformation("消息清理完成 - 私聊消息: {PrivateCount} 条, 群聊消息: {GroupCount} 条, 删除目录: {DeletedDirs} 个, 耗时: {Elapsed}ms",
                privateCount, groupCount, deletedDirs, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            logger.LogError(ex, "消息清理任务执行失败,将在下次调度时重试");
        }
    }

    private async Task<int> CleanupOldFilesAsync(IStorageProvider storageProvider, DateTimeOffset cutoffTime, CancellationToken cancellationToken)
    {
        var deletedCount = 0;
        var cutoffDate = DateOnly.FromDateTime(cutoffTime.DateTime);

        try
        {
            // 遍历 messages 目录下的所有日期目录
            var messagesPath = Path.Combine("wwwroot/uploads", "messages");
            if (!Directory.Exists(messagesPath))
            {
                logger.LogWarning("消息文件目录不存在: {Path}", messagesPath);
                return 0;
            }

            var directories = Directory.GetDirectories(messagesPath);

            foreach (var dir in directories)
            {
                var dirName = Path.GetFileName(dir);

                // 尝试解析目录名为日期 (yyyy-MM-dd)
                if (DateOnly.TryParseExact(dirName, "yyyy-MM-dd", out var dirDate))
                {
                    if (dirDate < cutoffDate)
                    {
                        try
                        {
                            await storageProvider.DeleteDirectoryAsync($"messages/{dirName}", cancellationToken);
                            deletedCount++;
                            logger.LogInformation("删除过期文件目录: messages/{DirName}", dirName);
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "删除目录失败: messages/{DirName}", dirName);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "清理文件目录时发生错误");
        }

        return deletedCount;
    }
}
