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
        _baseUrl = "/uploads";
        _rootFullPath = Path.GetFullPath(_rootPath);

        if (!Directory.Exists(_rootPath)) 
            Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        EnsureSafeFileName(fileName);
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.CreateVersion7()}{extension}";
        var filePath = GetSafePath(uniqueFileName);

        await using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, cancellationToken);

        return uniqueFileName;
    }

    public Task<Stream> GetAsync(string fileName, CancellationToken cancellationToken = default)
    {
        EnsureSafeFileName(fileName);
        var filePath = GetSafePath(fileName);
        return File.Exists(filePath)
            ? Task.FromResult<Stream>(new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
            : throw new FileNotFoundException($"File not found: {fileName}");
    }

    public Task DeleteAsync(string fileName, CancellationToken cancellationToken = default)
    {
        EnsureSafeFileName(fileName);
        var filePath = GetSafePath(fileName);
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }

        return Task.CompletedTask;
    }

    public string GetPublicUrl(string fileName)
    {
        return $"{_baseUrl}/{fileName}";
    }

    public Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken = default)
    {
        EnsureSafeFileName(fileName);
        var filePath = GetSafePath(fileName);
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

    private string GetSafePath(string fileName)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, fileName));
        return fullPath.StartsWith(_rootFullPath + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            ? fullPath
            : throw new ArgumentException("Invalid file path", nameof(fileName));
    }
}
