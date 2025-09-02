# Legnext Midjourney API Documentation

## Overview

The Legnext Midjourney API provides developers with programmatic access to AI image generation capabilities without requiring a personal Midjourney account.

## Base URL
```
https://legnext.ai/api/v1
```

## Authentication

All API requests require an API key. You can create and manage API keys in your dashboard.

### API Key Format
```
lnx_[64_character_hex_string]
```

### Authentication Methods

**Option 1: Authorization Header (Recommended)**
```bash
Authorization: Bearer lnx_your_api_key_here
```

**Option 2: Custom Header**
```bash
X-API-Key: lnx_your_api_key_here
```

## Endpoints

### 1. Generate Image

Generate AI images using text prompts.

**POST** `/api/v1/generate`

**Headers:**
```
Authorization: Bearer lnx_your_api_key_here
Content-Type: application/json
```

**Request Body:**
```json
{
  "prompt": "a beautiful landscape with mountains and lake",
  "model": "v6",          // Optional: "v5", "v6", "niji"
  "mode": "fast",         // Optional: "fast", "turbo", "mixed"
  "aspect_ratio": "16:9", // Optional: "1:1", "16:9", "9:16", etc.
  "stylize": 100,         // Optional: 0-1000
  "chaos": 0,             // Optional: 0-100
  "quality": "1"          // Optional: "0.25", "0.5", "1", "2"
}
```

**Response:**
```json
{
  "success": true,
  "task_id": "cm123456789",
  "status": "pending",
  "estimated_cost": 2,
  "remaining_credits": 98,
  "message": "Image generation task has been queued. Use the task_id to check status."
}
```

**API Call Costs:**
- Turbo mode: 1 API call
- Fast mode: 2 API calls  
- Mixed mode: 3 API calls

### 2. Check Task Status

Check the status of a generation task.

**GET** `/api/v1/status/{task_id}`

**Headers:**
```
Authorization: Bearer lnx_your_api_key_here
```

**Response (Pending):**
```json
{
  "success": true,
  "task_id": "cm123456789",
  "status": "pending",
  "progress": 0,
  "prompt": "a beautiful landscape with mountains and lake",
  "model": "v6",
  "mode": "fast",
  "api_calls_used": 2,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:30Z"
}
```

**Response (Completed):**
```json
{
  "success": true,
  "task_id": "cm123456789",
  "status": "completed",
  "progress": 100,
  "result": {
    "image_url": "https://cdn.midjourney.com/...",
    "upscaled_urls": [
      "https://cdn.midjourney.com/upscaled1.jpg",
      "https://cdn.midjourney.com/upscaled2.jpg"
    ],
    "variations": [
      "https://cdn.midjourney.com/variation1.jpg"
    ]
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:30Z"
}
```

**Response (Failed):**
```json
{
  "success": true,
  "task_id": "cm123456789",
  "status": "failed",
  "failure_reason": "Prompt violates content policy",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:45Z"
}
```

**Status Values:**
- `pending`: Task is queued
- `generating`: Image is being generated
- `completed`: Generation completed successfully
- `failed`: Generation failed

### 3. Check Balance

Get your current API call balance and usage statistics.

**GET** `/api/v1/balance`

**Headers:**
```
Authorization: Bearer lnx_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "balance": {
    "api_calls_remaining": 150,
    "total_api_calls_purchased": 200,
    "total_api_calls_used": 50,
    "plan": "pro",
    "subscription_status": "active"
  },
  "usage_stats": {
    "images_generated": 25,
    "images_upscaled": 10,
    "variations_created": 5,
    "last_active": "2024-01-01T12:00:00Z"
  }
}
```

## Rate Limits

- **Free Plan**: 100 requests per month, 10 requests per minute
- **Pro Plan**: 5,000 requests per month, 60 requests per minute

## Error Responses

All errors return a JSON object with error details:

```json
{
  "error": "Invalid API key",
  "message": "The provided API key is invalid or inactive"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing API key)
- `402` - Payment Required (insufficient API call balance)
- `404` - Not Found (task or resource not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Code Examples

### Python
```python
import requests

API_KEY = "lnx_your_api_key_here"
BASE_URL = "https://legnext.ai/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Generate image
response = requests.post(f"{BASE_URL}/generate", 
    headers=headers,
    json={
        "prompt": "a serene mountain landscape",
        "mode": "fast"
    }
)

result = response.json()
task_id = result["task_id"]
print(f"Task ID: {task_id}")

# Check status
status_response = requests.get(f"{BASE_URL}/status/{task_id}", headers=headers)
status = status_response.json()
print(f"Status: {status['status']}")
```

### JavaScript/Node.js
```javascript
const axios = require('axios');

const API_KEY = 'lnx_your_api_key_here';
const BASE_URL = 'https://legnext.ai/api/v1';

const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
};

// Generate image
async function generateImage() {
    try {
        const response = await axios.post(`${BASE_URL}/generate`, {
            prompt: 'a serene mountain landscape',
            mode: 'fast'
        }, { headers });
        
        const taskId = response.data.task_id;
        console.log(`Task ID: ${taskId}`);
        
        // Check status
        const statusResponse = await axios.get(`${BASE_URL}/status/${taskId}`, { headers });
        console.log(`Status: ${statusResponse.data.status}`);
        
    } catch (error) {
        console.error('Error:', error.response.data);
    }
}

generateImage();
```

### cURL
```bash
# Generate image
curl -X POST "https://legnext.ai/api/v1/generate" \
  -H "Authorization: Bearer lnx_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a serene mountain landscape",
    "mode": "fast"
  }'

# Check status
curl -X GET "https://legnext.ai/api/v1/status/cm123456789" \
  -H "Authorization: Bearer lnx_your_api_key_here"

# Check balance
curl -X GET "https://legnext.ai/api/v1/balance" \
  -H "Authorization: Bearer lnx_your_api_key_here"
```

## API Key Management

### Creating API Keys
1. Log in to your dashboard at [legnext.ai](https://legnext.ai)
2. Navigate to "API Keys" section
3. Click "Create New API Key"
4. Give it a descriptive name
5. Copy and securely store the generated key

### API Key Limits
- **Free Plan**: Maximum 3 API keys
- **Pro Plan**: Maximum 10 API keys

### Security Best Practices
- Never expose API keys in client-side code
- Store keys securely using environment variables
- Regenerate keys if compromised
- Use descriptive names to track key usage
- Regularly audit and remove unused keys

## Pricing

### Free Tier
- 100 API calls (one-time)
- Rate limit: 10 requests/minute
- Maximum 3 API keys

### Pro Plan ($29/month)
- 5,000 API calls per month
- Rate limit: 60 requests/minute  
- Maximum 10 API keys
- Priority support

### API Call Costs
Each generation operation consumes different amounts of API calls:
- **Turbo mode**: 1 API call (fastest, lower quality)
- **Fast mode**: 2 API calls (balanced speed and quality)
- **Mixed mode**: 3 API calls (highest quality, slower)

Additional operations:
- **Upscale**: 1 API call per upscale
- **Variations**: 1 API call per variation set

## Support

- **Documentation**: [docs.legnext.ai](https://docs.legnext.ai)
- **Support Email**: support@legnext.ai
- **Status Page**: [status.legnext.ai](https://status.legnext.ai)

## Changelog

### v1.0.0 (Current)
- Initial API release
- Generate, status, and balance endpoints
- API key authentication
- Support for Midjourney v5, v6, and Niji models
- Multiple generation modes (turbo, fast, mixed)