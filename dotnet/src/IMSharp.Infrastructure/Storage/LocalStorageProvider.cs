using Microsoft.Extensions.Configuration;

namespace IMSharp.Infrastructure.Storage;

public class LocalStorageProvider : IStorageProvider
{
    private readonly string _rootPath;
    private readonly string _baseUrl;

    public LocalStorageProvider(IConfiguration configuration)
    {
        _rootPath = configuration["Storage:Local:RootPath"] ?? "wwwroot/uploads";
        _baseUrl = "/uploads";

        if (!Directory.Exists(_rootPath))
        {
            Directory.CreateDirectory(_rootPath);
        }
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        var uniqueFileName = $"{Guid.CreateVersion7()}{extension}";
        var filePath = Path.Combine(_rootPath, uniqueFileName);

        using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await stream.CopyToAsync(fileStream, cancellationToken);

        return uniqueFileName;
    }

    public Task<Stream> GetAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_rootPath, fileName);
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {fileName}");
        }

        return Task.FromResult<Stream>(new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read));
    }

    public Task DeleteAsync(string fileName, CancellationToken cancellationToken = default)
    {
        var filePath = Path.Combine(_rootPath, fileName);
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
        var filePath = Path.Combine(_rootPath, fileName);
        return Task.FromResult(File.Exists(filePath));
    }
}
