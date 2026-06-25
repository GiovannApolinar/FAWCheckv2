FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY maize-drs-backend/maize-drs-backend.csproj maize-drs-backend/
RUN dotnet restore maize-drs-backend/maize-drs-backend.csproj

COPY . .
RUN dotnet publish maize-drs-backend/maize-drs-backend.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:8080

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "maize-drs-backend.dll"]
