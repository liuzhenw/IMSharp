using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace IMSharp.Api.Filters;

public class SecurityRequirementsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // 检查端点是否需要认证
        var hasAuthorize = context.MethodInfo.DeclaringType?.GetCustomAttributes(true)
            .Union(context.MethodInfo.GetCustomAttributes(true))
            .OfType<AuthorizeAttribute>()
            .Any() ?? false;

        var hasAllowAnonymous = context.MethodInfo.DeclaringType?.GetCustomAttributes(true)
            .Union(context.MethodInfo.GetCustomAttributes(true))
            .OfType<AllowAnonymousAttribute>()
            .Any() ?? false;

        if (hasAuthorize && !hasAllowAnonymous)
        {
            // 创建安全方案引用 - 第一个参数是安全方案的名称,第二个参数是 document
            var schemeReference = new OpenApiSecuritySchemeReference("Bearer", context.Document);

            operation.Security =
            [
                new OpenApiSecurityRequirement
                {
                    { schemeReference, [] }
                }
            ];
        }
    }
}
