# vLLM Environment Controls Implementation

## Overview
Implemented environment variable controls for vLLM configuration, allowing administrators to disable vLLM entirely or provide static endpoint configuration.

## Environment Variables Added

### 1. DISABLE_VLLM
- **Purpose**: Completely disable vLLM option for all users
- **Default**: `false`
- **When set to `true`**:
  - Removes vLLM option from profile LLM provider dropdown
  - Forces users with vLLM preference to use Claude (ANTHROPIC)
  - Backend automatically falls back to Claude when user has vLLM selected

### 2. STATIC_VLLM_ENDPOINT
- **Purpose**: Provide admin-configured vLLM endpoint that overrides user settings
- **Default**: Empty string (user-configurable)
- **When configured**:
  - Users cannot edit vLLM endpoint URL in profile
  - Users cannot edit vLLM model name in profile
  - Shows read-only configuration with admin values
  - Backend uses static endpoint regardless of user preferences

## Implementation Details

### Backend Changes

#### 1. API Route (`/src/app/api/llm-agent/route.ts`)
```typescript
// Environment variable controls
const DISABLE_VLLM = process.env.DISABLE_VLLM === 'true';
const STATIC_VLLM_ENDPOINT = process.env.STATIC_VLLM_ENDPOINT;

// Apply environment variable overrides
if (DISABLE_VLLM && userPreferredProvider === 'VLLM') {
  console.log('vLLM disabled by environment variable, falling back to Claude');
  userPreferredProvider = 'ANTHROPIC';
}

if (STATIC_VLLM_ENDPOINT) {
  userVllmEndpoint = STATIC_VLLM_ENDPOINT;
  console.log(`Using static vLLM endpoint: ${STATIC_VLLM_ENDPOINT}`);
}
```

#### 2. Configuration API (`/src/app/api/config/route.ts`)
- New endpoint to expose environment configuration to frontend
- Returns sanitized environment settings for UI adaptation
- Allows frontend to dynamically adjust based on admin configuration

### Frontend Changes

#### 1. Profile Page (`/src/app/profile/page.tsx`)
- Added environment configuration state and fetching
- Conditional rendering of vLLM option in provider dropdown
- Dynamic UI for vLLM configuration section:
  - **User-configurable mode**: Shows input fields for endpoint and model
  - **Static mode**: Shows read-only displays with admin-configured values

#### 2. UI Adaptations
- **DISABLE_VLLM=true**: vLLM option hidden from dropdown
- **STATIC_VLLM_ENDPOINT set**: vLLM config fields become read-only with admin values
- Appropriate messaging to inform users about configuration source

## User Experience

### When DISABLE_VLLM=true
1. vLLM option not visible in LLM provider dropdown
2. Users currently using vLLM are automatically switched to Claude
3. No vLLM configuration options shown

### When STATIC_VLLM_ENDPOINT is configured
1. vLLM option available in dropdown
2. vLLM configuration section shows read-only fields
3. Clear indication that configuration is set by administrator
4. Users can select vLLM but cannot modify endpoint/model settings

### Normal operation (no environment overrides)
1. Full vLLM option available in dropdown
2. User-configurable endpoint and model settings
3. Standard setup instructions and documentation links

## Configuration Examples

### Disable vLLM completely
```bash
DISABLE_VLLM=true
```

### Use static vLLM endpoint
```bash
STATIC_VLLM_ENDPOINT=http://your-vllm-server:8000
VLLM_MODEL_NAME=meta-llama/Llama-3.1-8B-Instruct
```

### Combined with other settings
```bash
# Disable vLLM for security reasons
DISABLE_VLLM=true
ANTHROPIC_API_KEY=your_claude_key

# OR use organization-wide vLLM endpoint
STATIC_VLLM_ENDPOINT=http://org-vllm.company.com:8000
VLLM_MODEL_NAME=meta-llama/Llama-3.1-8B-Instruct
```

## Files Modified

1. `/src/app/api/llm-agent/route.ts` - Backend provider selection logic
2. `/src/app/api/config/route.ts` - New configuration API endpoint
3. `/src/app/profile/page.tsx` - Frontend UI adaptations
4. `.env.example` - Environment variable documentation

## Benefits

### For Administrators
- **Security Control**: Can disable vLLM if not desired for organization
- **Centralized Configuration**: Single vLLM endpoint for all users
- **Simplified Management**: Users don't need to configure vLLM individually
- **Cost Control**: Prevent users from spinning up their own vLLM instances

### For Users
- **Simplified Setup**: When static endpoint configured, no setup required
- **Clear Guidance**: UI clearly indicates when settings are admin-managed
- **Consistent Experience**: All users use same vLLM configuration when static

### For Deployment
- **Flexible Configuration**: Can be adapted for different deployment scenarios
- **Production Ready**: Environment variables work in containerized deployments
- **Backwards Compatible**: Works with existing configurations

## Testing

✅ **Build Success**: All changes compile without errors  
✅ **Type Safety**: Full TypeScript compliance maintained  
✅ **API Functionality**: Configuration endpoint returns correct values  
✅ **UI Adaptation**: Frontend correctly adapts to environment settings

## Usage Scenarios

1. **Enterprise Deployment**: Use `STATIC_VLLM_ENDPOINT` for centralized AI infrastructure
2. **Security-First Environment**: Use `DISABLE_VLLM=true` to enforce Claude usage only
3. **Development Environment**: Leave both unset for full user control
4. **Hybrid Setup**: Configure static endpoint but allow Claude as alternative

The implementation provides flexible administrative control over vLLM usage while maintaining a clean user experience and backwards compatibility.
