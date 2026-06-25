@description('Azure region for the Container Apps deployment.')
param location string = resourceGroup().location

@description('Azure Container Registry name.')
param containerRegistryName string

@description('Azure Container Apps managed environment name.')
param managedEnvironmentName string

@description('Azure Storage Account name used for assessment images.')
param storageAccountName string

@description('Private blob container name for assessment images.')
param blobContainerName string = 'assessment-images'

@description('Azure SQL logical server name.')
param sqlServerName string

@description('Azure SQL database name.')
param sqlDatabaseName string

@description('Azure SQL admin login name.')
param sqlAdminLogin string

@secure()
@description('Azure SQL admin password.')
param sqlAdminPassword string

@secure()
@description('JWT signing key injected into the backend app.')
param jwtKey string

@secure()
@description('Bootstrap admin email injected into the backend app for first-start account seeding.')
param bootstrapAdminEmail string

@secure()
@description('Bootstrap admin password injected into the backend app for first-start account seeding.')
param bootstrapAdminPassword string

@description('JWT issuer value for the backend app.')
param jwtIssuer string

@description('JWT audience value for the backend app.')
param jwtAudience string

@description('Public base URL for the frontend app, such as https://app.example.com.')
param publicAppBaseUrl string

@description('Public base URL for the backend app, such as https://api.example.com.')
param publicApiBaseUrl string

@description('Container App name for the frontend.')
param frontendAppName string = 'maize-drs-frontend'

@description('Container App name for the backend.')
param backendAppName string = 'maize-drs-backend'

@description('Container App name for the internal inference service.')
param inferenceAppName string = 'maize-drs-inference'

@description('ACR repository name for the frontend image.')
param frontendImageRepository string = 'maize-drs-frontend'

@description('ACR repository name for the backend image.')
param backendImageRepository string = 'maize-drs-backend'

@description('ACR repository name for the inference image.')
param inferenceImageRepository string = 'maize-drs-inference'

@description('Image tag to deploy for the frontend.')
param frontendImageTag string = 'latest'

@description('Image tag to deploy for the backend.')
param backendImageTag string = 'latest'

@description('Image tag to deploy for the inference service.')
param inferenceImageTag string = 'latest'

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: containerRegistryName
}

resource managedEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: managedEnvironmentName
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

var acrCredentials = listCredentials(containerRegistry.id, containerRegistry.apiVersion)
var acrPassword = acrCredentials.passwords[0].value
var storageAccountKey = listKeys(storageAccount.id, storageAccount.apiVersion).keys[0].value
var blobConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccountKey};EndpointSuffix=${environment().suffixes.storage}'
var sqlConnectionString = 'Server=tcp:${sqlServerName}.database.windows.net,1433;Initial Catalog=${sqlDatabaseName};Persist Security Info=False;User ID=${sqlAdminLogin};Password=${sqlAdminPassword};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

resource inferenceApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: inferenceAppName
  location: location
  properties: {
    managedEnvironmentId: managedEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 5000
        transport: 'auto'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: acrCredentials.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acrPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'inference'
          image: '${containerRegistry.properties.loginServer}/${inferenceImageRepository}:${inferenceImageTag}'
          env: [
            {
              name: 'PORT'
              value: '5000'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 5000
                httpHeaders: []
              }
              initialDelaySeconds: 20
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 5000
                httpHeaders: []
              }
              initialDelaySeconds: 10
              periodSeconds: 20
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendAppName
  location: location
  properties: {
    managedEnvironmentId: managedEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: acrCredentials.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acrPassword
        }
        {
          name: 'sql-connection-string'
          value: sqlConnectionString
        }
        {
          name: 'jwt-key'
          value: jwtKey
        }
        {
          name: 'bootstrap-admin-email'
          value: bootstrapAdminEmail
        }
        {
          name: 'bootstrap-admin-password'
          value: bootstrapAdminPassword
        }
        {
          name: 'blob-connection-string'
          value: blobConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: '${containerRegistry.properties.loginServer}/${backendImageRepository}:${backendImageTag}'
          env: [
            {
              name: 'ASPNETCORE_ENVIRONMENT'
              value: 'Production'
            }
            {
              name: 'ConnectionStrings__Default'
              secretRef: 'sql-connection-string'
            }
            {
              name: 'Database__Provider'
              value: 'SqlServer'
            }
            {
              name: 'Database__AutoMigrate'
              value: 'false'
            }
            {
              name: 'Jwt__Key'
              secretRef: 'jwt-key'
            }
            {
              name: 'Jwt__Issuer'
              value: jwtIssuer
            }
            {
              name: 'Jwt__Audience'
              value: jwtAudience
            }
            {
              name: 'Auth__BootstrapAdminEmail'
              secretRef: 'bootstrap-admin-email'
            }
            {
              name: 'Auth__BootstrapAdminPassword'
              secretRef: 'bootstrap-admin-password'
            }
            {
              name: 'BlobStorage__Provider'
              value: 'AzureBlob'
            }
            {
              name: 'BlobStorage__ConnectionString'
              secretRef: 'blob-connection-string'
            }
            {
              name: 'BlobStorage__ContainerName'
              value: blobContainerName
            }
            {
              name: 'Inference__BaseUrl'
              value: 'https://${inferenceApp.properties.configuration.ingress.fqdn}'
            }
            {
              name: 'Inference__PredictPath'
              value: '/predict'
            }
            {
              name: 'Cors__AllowedOrigins__0'
              value: publicAppBaseUrl
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8080
                httpHeaders: []
              }
              initialDelaySeconds: 25
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 8080
                httpHeaders: []
              }
              initialDelaySeconds: 10
              periodSeconds: 20
            }
          ]
          resources: {
            cpu: json('0.75')
            memory: '1.5Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

resource frontendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: managedEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
      }
      registries: [
        {
          server: containerRegistry.properties.loginServer
          username: acrCredentials.username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acrPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: '${containerRegistry.properties.loginServer}/${frontendImageRepository}:${frontendImageTag}'
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'NEXT_PUBLIC_API_BASE_URL'
              value: publicApiBaseUrl
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/api/health'
                port: 3000
                httpHeaders: []
              }
              initialDelaySeconds: 20
              periodSeconds: 30
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/api/health'
                port: 3000
                httpHeaders: []
              }
              initialDelaySeconds: 10
              periodSeconds: 20
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 2
      }
    }
  }
}

output frontendConfiguredUrl string = publicAppBaseUrl
output apiConfiguredUrl string = publicApiBaseUrl
output frontendContainerAppFqdn string = frontendApp.properties.configuration.ingress.fqdn
output backendContainerAppFqdn string = backendApp.properties.configuration.ingress.fqdn
output inferenceContainerAppFqdn string = inferenceApp.properties.configuration.ingress.fqdn
