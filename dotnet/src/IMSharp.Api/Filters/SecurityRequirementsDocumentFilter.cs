using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace IMSharp.Api.Filters;

public class SecurityRequirementsDocumentFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument document, DocumentFilterContext context)
    {
        // 遍历所有路径和操作
        foreach (var path in document.Paths.Values)
        {
            foreach (var operation in path.Operations.Values)
            {
                // 检查操作是否已经有安全要求
                if (operation.Security == null || operation.Security.Count == 0)
                {
                    // 为所有操作添加 Bearer 安全要求
                    var schemeReference = new OpenApiSecuritySchemeReference("Bearer", document);
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
    }
}
