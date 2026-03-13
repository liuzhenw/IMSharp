namespace IMSharp.Infrastructure.Storage;

public interface IStorageProvider
{
    Task<string> SaveAsync(Stream stream, string fileName, string contentType, string? subPath = null, CancellationToken cancellationToken = default);
    Task<Stream> GetAsync(string fileName, CancellationToken cancellationToken = default);
    Task DeleteAsync(string fileName, CancellationToken cancellationToken = default);
    Task DeleteDirectoryAsync(string directoryPath, CancellationToken cancellationToken = default);
    string GetPublicUrl(string fileName);
    Task<bool> ExistsAsync(string fileName, CancellationToken cancellationToken = default);
}
