FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/IMSharp.Api/IMSharp.Api.csproj", "src/IMSharp.Api/"]
COPY ["src/IMSharp.Core/IMSharp.Core.csproj", "src/IMSharp.Core/"]
COPY ["src/IMSharp.Domain/IMSharp.Domain.csproj", "src/IMSharp.Domain/"]
COPY ["src/IMSharp.Infrastructure/IMSharp.Infrastructure.csproj", "src/IMSharp.Infrastructure/"]
RUN dotnet restore "src/IMSharp.Api/IMSharp.Api.csproj"
COPY . .
WORKDIR "/src/src/IMSharp.Api"
RUN dotnet build "./IMSharp.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./IMSharp.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "IMSharp.Api.dll"]
