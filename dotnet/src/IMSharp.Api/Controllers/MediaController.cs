using IMSharp.Core.DTOs;
using IMSharp.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMSharp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController(IStorageProvider storageProvider, IConfiguration configuration)
    : ControllerBase
{
    private readonly long _maxFileSizeBytes = long.Parse(configuration["Storage:Local:MaxFileSizeMB"] ?? "10") * 1024 * 1024;
    private readonly string[] _allowedExtensions = configuration.GetSection("Storage:Local:AllowedExtensions").Get<string[]>() ?? [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    [HttpPost("upload/{type}")]
    public async Task<ActionResult<UploadResponse>> Upload(string type, IFormFile? file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        if (file.Length > _maxFileSizeBytes)
            return BadRequest($"File size exceeds maximum allowed size of {_maxFileSizeBytes / 1024 / 1024} MB");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
            return BadRequest($"File type not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");

        var subPath = type switch
        {
            "message" => $"messages/{DateTimeOffset.UtcNow:yyyy-MM-dd}",
            "avatar" => "avatars",
            _ => null
        };

        if (subPath == null)
            return BadRequest($"Invalid upload type '{type}'. Allowed types: message, avatar");

        await using var stream = file.OpenReadStream();
        var relativePath = await storageProvider.SaveAsync(stream, file.FileName, file.ContentType, subPath, cancellationToken);
        var url = storageProvider.GetPublicUrl(relativePath);

        return Ok(new UploadResponse(relativePath, url));
    }

    [HttpGet("{**filename}")]
    public async Task<IActionResult> Get(string filename, CancellationToken cancellationToken)
    {
        try
        {
            await using var stream = await storageProvider.GetAsync(filename, cancellationToken);
            var contentType = GetContentType(filename);
            return File(stream, contentType);
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
    }

    private static string GetContentType(string filename)
    {
        var extension = Path.GetExtension(filename).ToLowerInvariant();
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}
