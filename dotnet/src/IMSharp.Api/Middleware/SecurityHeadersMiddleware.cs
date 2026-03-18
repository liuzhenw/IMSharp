namespace IMSharp.Api.Middleware;

public class SecurityHeadersMiddleware(RequestDelegate next, IConfiguration config)
{
    public async Task Invoke(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        var embedOrigins = config.GetSection("Embed:AllowedOrigins").Get<string[]>() ?? [];

        if (path.StartsWith("/embed", StringComparison.OrdinalIgnoreCase) && embedOrigins.Length > 0)
        {
            var frameAncestors = string.Join(" ", embedOrigins);
            context.Response.Headers.ContentSecurityPolicy = $"frame-ancestors 'self' {frameAncestors}";
        }
        else
        {
            context.Response.Headers.XFrameOptions = "SAMEORIGIN";
            context.Response.Headers.ContentSecurityPolicy = "frame-ancestors 'self'";
        }

        await next(context);
    }
}
