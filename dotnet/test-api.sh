#!/bin/bash

# IMSharp API 测试脚本
# 用于验证 API 基本功能

API_BASE_URL="http://localhost:5185"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "IMSharp API 测试"
echo "=========================================="
echo ""

# 测试 1: 健康检查
echo -n "测试 1: 健康检查端点... "
HEALTH_RESPONSE=$(curl -s "${API_BASE_URL}/api/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "  响应: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ 失败${NC}"
    echo "  响应: $HEALTH_RESPONSE"
fi
echo ""

# 测试 2: Swagger UI
echo -n "测试 2: Swagger UI 可访问性... "
SWAGGER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/swagger/index.html")
if [ "$SWAGGER_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "  Swagger UI: ${API_BASE_URL}/swagger"
else
    echo -e "${RED}✗ 失败${NC}"
    echo "  HTTP 状态码: $SWAGGER_RESPONSE"
fi
echo ""

# 测试 3: 未授权访问受保护端点
echo -n "测试 3: 未授权访问受保护端点... "
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/api/auth/me")
if [ "$AUTH_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "  正确返回 401 Unauthorized"
else
    echo -e "${RED}✗ 失败${NC}"
    echo "  HTTP 状态码: $AUTH_RESPONSE (期望 401)"
fi
echo ""

# 测试 4: 数据库连接
echo -n "测试 4: 数据库连接... "
DB_TEST=$(psql -h localhost -U postgres -d im_sharp -c "SELECT COUNT(*) FROM users;" 2>&1)
if echo "$DB_TEST" | grep -q "count"; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "  数据库连接正常"
else
    echo -e "${YELLOW}⚠ 警告${NC}"
    echo "  无法连接数据库或查询失败"
fi
echo ""

# 测试 5: 上传目录
echo -n "测试 5: 上传目录存在性... "
if [ -d "src/IMSharp.Api/wwwroot/uploads" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "  上传目录: src/IMSharp.Api/wwwroot/uploads"
else
    echo -e "${RED}✗ 失败${NC}"
    echo "  上传目录不存在"
fi
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "下一步:"
echo "1. 配置 OAuth 提供商 (编辑 src/IMSharp.Api/appsettings.json)"
echo "2. 访问 Swagger UI: ${API_BASE_URL}/swagger"
echo "3. 使用 OAuth token 测试登录功能"
echo ""
echo "详细测试指南请查看: API_TESTING.md"
