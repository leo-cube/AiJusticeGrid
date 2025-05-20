# API-Driven Architecture for Police Investigation System

This document outlines the API-driven architecture implemented for the Police Investigation System, with a focus on dynamic data fetching, configuration management, and Augment AI integration.

## Core Principles

1. **No Hardcoded Values**: All data is fetched from APIs or configuration files
2. **Dynamic Components**: UI components adapt to data from the backend
3. **Modular Design**: Easy addition/removal of crime types, agents, and features
4. **Configurable Behavior**: System behavior can be modified through configuration
5. **Graceful Fallbacks**: Components handle API failures with appropriate fallbacks

## Architecture Overview

### Configuration Layer

- **defaultSettings.json**: Default configuration for the entire application
- **.env**: Environment-specific configuration (API endpoints, timeouts, etc.)
- **configService.ts**: Service for fetching and updating configuration

### API Service Layer

- **api.ts**: Base API service with error handling, retries, and timeouts
- **Domain-specific services**: Specialized services for crimes, agents, etc.
- **Mock API implementation**: For development and testing

### Augment AI Integration

- **augmentAI.ts**: Service for integrating with Augment AI
- **Dynamic agent mapping**: Maps crime types to specialized AI agents
- **Fallback responses**: Handles API failures gracefully

## Key Components

### API Service

The API service provides a consistent interface for making API calls with:

- Automatic retries for failed requests
- Timeout handling
- Error normalization
- Mock API support for development

```typescript
// Example API call
const crimes = await crimeService.getAllCrimes();
```

### Configuration Service

The configuration service manages application settings:

- Fetches settings from API
- Falls back to default settings when API fails
- Provides methods for updating settings
- Supports dot notation for accessing nested settings

```typescript
// Example configuration access
const primaryColor = await configService.getSetting('ui.theme.primary');
```

### Augment AI Service

The Augment AI service integrates with the Augment AI API:

- Maps crime types to specialized AI agents
- Handles API calls to Augment AI
- Provides fallback responses when API fails
- Configurable through the admin interface

```typescript
// Example Augment AI integration
const response = await augmentAIService.getResponse(question, agentType);
```

## Dynamic UI Components

All UI components are designed to:

1. **Load data from APIs**: Fetch data on component mount
2. **Show loading states**: Display skeletons while loading
3. **Handle errors**: Show error messages with retry options
4. **Use fallbacks**: Fall back to default data when APIs fail

Example component structure:

```tsx
function CrimeTypeList() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [crimeTypes, setCrimeTypes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await crimeService.getCrimeTypes();
        setCrimeTypes(data);
      } catch (err) {
        setError('Failed to load crime types');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      {crimeTypes.map(type => (
        <CrimeTypeCard key={type.id} type={type} />
      ))}
    </div>
  );
}
```

## Configuration Management

Administrators can configure the system through the settings interface:

1. **Agent Assignments**: Assign specialized AI agents to crime types
2. **UI Customization**: Customize colors, themes, and layouts
3. **System Behavior**: Configure timeouts, refresh intervals, etc.

## Adding New Features

To add a new feature (e.g., a new crime type):

1. Update the API to support the new crime type
2. Add the new crime type to defaultSettings.json
3. Assign an AI agent to the new crime type in the admin interface

No code changes are required for basic feature additions.

## Best Practices

1. **Always fetch data from APIs**: Never hardcode data in components
2. **Handle loading and error states**: Every component should handle these
3. **Provide fallbacks**: Always have a fallback when APIs fail
4. **Use configuration**: Make behavior configurable where possible
5. **Test with mock APIs**: Use mock APIs for testing and development
