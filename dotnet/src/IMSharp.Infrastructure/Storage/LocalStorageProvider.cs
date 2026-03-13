using Microsoft.Extensions.Configuration;

namespace IMSharp.Infrastructure.Storage;

public class LocalStorageProvider : IStorageProvider
{
    private readonly string _rootPath;
    private readonly string _baseUrl;
    private readonly string _rootFullPath;

    public LocalStorageProvider(IConfiguration configuration)
    {
        _rootPath = configuration["Storage:Local:RootPath"] ?? "wwwroot/uploads";
        _baseUrl = $"{configuration["Storage:Local:BaseUrl"]}/uploads";
        _rootFullPath = Path.GetFullPath(_rootPath);

        if (!Directory.Exists(_rootPath))
            Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType,
        string? subPath = null, CancellationToken cancellationToken = default)
    {
        EnsureSafeFileName(fileName);
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.CreateVersion7()}{extension}";

        string relativePath;
        string fullDir;

        if (!string.IsNullOrEmpty(subPath))
        {
            EnsureSafeRelativePath(subPath);
            fullDir = Path.GetFullPath(Path.Combine(_rootPath, subPath));
            if (!fullDir.StartsWith(_rootFullPath + Path.DirectorySeparatorChar, StringComparison.Ordinal))
                throw new ArgumentException("Invalid subPath", nameof(subPath));
            
            if (!Directory.Exists(fullDir))
                Directory.CreateDirectory(fullDir);
            relativePath = $"{subPath}/{uniqueFileName}";
        }
        else
        {
            fullDir = _rootPath;
            relativePath = uniqueFileName;
        }

        var filePath = Path.Combine(fullDir, uniqueFileName);
        await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, cancellationToken);

        return relativePath;
    }

    public Task<Stream> GetAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var filePath = GetSafePath(relativePath);
        return File.Exists(filePath)
            ? Task.FromResult<Stream>(new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
            : throw new FileNotFoundException($"File not found: {relativePath}");
    }

    public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var filePath = GetSafePath(relativePath);
        if (File.Exists(filePath))
            File.Delete(filePath);
        return Task.CompletedTask;
    }

    public Task DeleteDirectoryAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var directoryPath = GetSafePath(relativePath);
        if (Directory.Exists(directoryPath))
            Directory.Delete(directoryPath, recursive: true);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string relativePath)
    {
        return $"{_baseUrl}/{relativePath}";
    }

    public Task<bool> ExistsAsync(string relativePath, CancellationToken cancellationToken = default)
    {
        var filePath = GetSafePath(relativePath);
        return Task.FromResult(File.Exists(filePath));
    }

    private static void EnsureSafeFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("File name is required", nameof(fileName));

        if (fileName != Path.GetFileName(fileName) ||
            fileName.Contains(Path.DirectorySeparatorChar) ||
            fileName.Contains(Path.AltDirectorySeparatorChar))
            throw new ArgumentException("Invalid file name", nameof(fileName));
    }

    private static void EnsureSafeRelativePath(string subPath)
    {
        if (subPath.Contains(".."))
            throw new ArgumentException("Invalid subPath: path traversal not allowed", nameof(subPath));
    }

    private string GetSafePath(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            throw new ArgumentException("Path is required", nameof(relativePath));

        if (relativePath.Contains(".."))
            throw new ArgumentException("Invalid path: path traversal not allowed", nameof(relativePath));

        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, relativePath));
        return fullPath.StartsWith(_rootFullPath + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            ? fullPath
            : throw new ArgumentException("Invalid file path", nameof(relativePath));
    }
}
