# AgentPay Demo Data - Sample Agents and Services

This document contains 10 realistic examples for registering AI agents and their services on the AgentPay platform.

---

## Agent 1: WorkflowPilot

### Agent Registration

```
Agent Name: WorkflowPilot
Support Email: support@workflowpilot.io

Description: Automates repetitive workflows, connects APIs, and manages multi-step task execution across systems. Ideal for businesses looking to streamline operations.

API Endpoint: https://api.workflowpilot.io
API Key: sk_test_9pQ4wZ1hT6dK3mN8vX2yZ
Webhook URL: https://hooks.workflowpilot.io/status
Documentation URL: https://docs.workflowpilot.io

Capabilities: task-automation, workflow-orchestration, api-integration, event-handling
Pricing Model: Per Call
Price per Call (USDC): 1.00
Logo URL: https://cdn.workflowpilot.io/logo.png
Website URL: https://workflowpilot.io
Terms of Service URL: https://workflowpilot.io/terms
```

### Service: Task Execution API

```
Select Agent: WorkflowPilot
Service Type: Custom
Service Name: Execute Workflow Task

Currency: USDC
Price Per Call: 1.00
Endpoint Path: /api/v1/execute

Description: Executes multi-step workflows with automatic retries and state management. Supports conditional logic and parallel task execution.

HTTP Method: POST
Rate Limit (calls/min): 60
Timeout (seconds): 30
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 4, "backoff": "exponential", "initialDelay": 1000}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "workflow_id": {"type": "string"},
    "inputs": {"type": "object"},
    "callback_url": {"type": "string", "format": "uri"}
  },
  "required": ["workflow_id"]
}

Usage Examples:
curl -X POST https://api.workflowpilot.io/api/v1/execute -H "Authorization: Bearer sk_test_xxx" -H "Content-Type: application/json" -d '{"workflow_id": "wf_123", "inputs": {"data": "test"}}'
curl -X POST https://api.workflowpilot.io/api/v1/execute -H "Authorization: Bearer sk_test_xxx" -d '{"workflow_id": "payment_flow", "inputs": {"amount": 100}}'
```

---

## Agent 2: DataMiner AI

### Agent Registration

```
Agent Name: DataMiner AI
Support Email: hello@dataminer.ai

Description: Advanced data extraction and analysis service that pulls insights from unstructured data sources. Perfect for research and business intelligence.

API Endpoint: https://api.dataminer.ai
API Key: sk_live_dm_7fH2kL9pQ4wZ1hT
Webhook URL: https://hooks.dataminer.ai/webhook
Documentation URL: https://docs.dataminer.ai

Capabilities: data-extraction, text-analysis, sentiment-analysis, report-generation
Pricing Model: Per Call
Price per Call (USDC): 0.75
Logo URL: https://assets.dataminer.ai/logo.svg
Website URL: https://dataminer.ai
Terms of Service URL: https://dataminer.ai/terms
```

### Service: Extract Data

```
Select Agent: DataMiner AI
Service Type: Custom
Service Name: Data Extraction API

Currency: USDC
Price Per Call: 0.75
Endpoint Path: /api/v2/extract

Description: Extract structured data from URLs, documents, and text content using advanced ML models.

HTTP Method: POST
Rate Limit (calls/min): 120
Timeout (seconds): 45
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 3, "backoff": "linear", "initialDelay": 500}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "source_url": {"type": "string", "format": "uri"},
    "content_type": {"type": "string", "enum": ["web", "pdf", "text", "json"]},
    "extract_fields": {"type": "array", "items": {"type": "string"}}
  },
  "required": ["source_url"]
}

Usage Examples:
curl -X POST https://api.dataminer.ai/api/v2/extract -H "Authorization: Bearer sk_live_dm_xxx" -d '{"source_url": "https://example.com/page", "extract_fields": ["title", "price"]}'
curl -X POST https://api.dataminer.ai/api/v2/extract -H "Content-Type: application/json" -d '{"source_url": "https://news.com/article", "content_type": "web"}'
```

---

## Agent 3: SecureVerify

### Agent Registration

```
Agent Name: SecureVerify
Support Email: support@secureverify.io

Description: KYC/AML verification service for identity validation, document verification, and background checks. Compliant with international regulations.

API Endpoint: https://api.secureverify.io
API Key: sk_prod_sv_5cB8jK2mN9pQ4
Webhook URL: https://hooks.secureverify.io/verify
Documentation URL: https://docs.secureverify.io

Capabilities: identity-verification, document-verification, kyc-compliance, background-checks
Pricing Model: Per Call
Price per Call (USDC): 2.50
Logo URL: https://cdn.secureverify.io/images/logo.png
Website URL: https://secureverify.io
Terms of Service URL: https://secureverify.io/legal
```

### Service: Identity Verification

```
Select Agent: SecureVerify
Service Type: Custom
Service Name: Verify Identity

Currency: USDC
Price Per Call: 2.50
Endpoint Path: /api/v1/verify/identity

Description: Verify user identity by comparing uploaded documents with selfie photos. Returns verification status and risk score.

HTTP Method: POST
Rate Limit (calls/min): 30
Timeout (seconds): 60
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 2, "backoff": "exponential", "initialDelay": 2000}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "document_type": {"type": "string", "enum": ["passport", "drivers_license", "national_id"]},
    "document_image": {"type": "string", "format": "base64"},
    "selfie_image": {"type": "string", "format": "base64"},
    "country": {"type": "string"}
  },
  "required": ["document_type", "document_image", "selfie_image"]
}

Usage Examples:
curl -X POST https://api.secureverify.io/api/v1/verify/identity -H "Authorization: Bearer sk_prod_sv_xxx" -d '{"document_type": "passport", "document_image": "base64...", "selfie_image": "base64..."}'
```

---

## Agent 4: TranslateHub

### Agent Registration

```
Agent Name: TranslateHub
Support Email: api@translatehub.com

Description: Neural machine translation service supporting 100+ languages with context-aware translations. Includes batch processing and glossary support.

API Endpoint: https://api.translatehub.com
API Key: sk_live_th_8dG3kM1nP6qR9
Webhook URL: https://hooks.translatehub.com/translations
Documentation URL: https://docs.translatehub.com

Capabilities: translation, localization, batch-processing, glossary-management
Pricing Model: Per Call
Price per Call (USDC): 0.25
Logo URL: https://translatehub.com/assets/logo.png
Website URL: https://translatehub.com
Terms of Service URL: https://translatehub.com/tos
```

### Service: Translate Text

```
Select Agent: TranslateHub
Service Type: Custom
Service Name: Translate API

Currency: USDC
Price Per Call: 0.25
Endpoint Path: /api/v3/translate

Description: Translate text between 100+ languages with automatic source language detection and context preservation.

HTTP Method: POST
Rate Limit (calls/min): 200
Timeout (seconds): 15
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 5, "backoff": "exponential", "initialDelay": 200}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "text": {"type": "string"},
    "target_lang": {"type": "string"},
    "source_lang": {"type": "string"},
    "preserve_formatting": {"type": "boolean"}
  },
  "required": ["text", "target_lang"]
}

Usage Examples:
curl -X POST https://api.translatehub.com/api/v3/translate -H "Authorization: Bearer sk_live_th_xxx" -d '{"text": "Hello world", "target_lang": "es"}'
curl -X POST https://api.translatehub.com/api/v3/translate -d '{"text": "Bonjour", "target_lang": "en", "source_lang": "fr"}'
```

---

## Agent 5: CodeAssist

### Agent Registration

```
Agent Name: CodeAssist
Support Email: developers@codeassist.dev

Description: AI-powered code review, debugging, and refactoring assistant. Supports major programming languages and frameworks.

API Endpoint: https://api.codeassist.dev
API Key: sk_dev_ca_3fH6jK9nM2pQ5
Webhook URL: https://hooks.codeassist.dev/code-events
Documentation URL: https://docs.codeassist.dev

Capabilities: code-review, debugging, refactoring, code-generation, security-scan
Pricing Model: Per Call
Price per Call (USDC): 0.50
Logo URL: https://codeassist.dev/img/logo.svg
Website URL: https://codeassist.dev
Terms of Service URL: https://codeassist.dev/terms-of-service
```

### Service: Code Review

```
Select Agent: CodeAssist
Service Type: Custom
Service Name: Code Review API

Currency: USDC
Price Per Call: 0.50
Endpoint Path: /api/v1/review

Description: Analyze code for bugs, security vulnerabilities, performance issues, and best practice violations with detailed reports.

HTTP Method: POST
Rate Limit (calls/min): 100
Timeout (seconds): 120
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 3, "backoff": "exponential", "initialDelay": 1000}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "language": {"type": "string"},
    "code": {"type": "string"},
    "check_types": {"type": "array", "items": {"type": "string", "enum": ["security", "bugs", "performance", "style"]}},
    "file_name": {"type": "string"}
  },
  "required": ["language", "code"]
}

Usage Examples:
curl -X POST https://api.codeassist.dev/api/v1/review -H "Authorization: Bearer sk_dev_ca_xxx" -d '{"language": "python", "code": "def add(a,b): return a+b", "check_types": ["security", "bugs"]}'
curl -X POST https://api.codeassist.dev/api/v1/review -d '{"language": "javascript", "code": "const x = 1;", "file_name": "index.js"}'
```

---

## Agent 6: VoiceForge

### Agent Registration

```
Agent Name: VoiceForge
Support Email: api@voiceforge.ai

Description: Text-to-speech API with 200+ natural-sounding voices across 50+ languages. Supports custom voice cloning and audio optimization.

API Endpoint: https://api.voiceforge.ai
API Key: sk_live_vf_1dH4kL7nM9pQ2
Webhook URL: https://hooks.voiceforge.ai/audio
Documentation URL: https://docs.voiceforge.ai

Capabilities: text-to-speech, voice-cloning, audio-enhancement, multi-language
Pricing Model: Per Call
Price per Call (USDC): 0.40
Logo URL: https://voiceforge.ai/static/logo.png
Website URL: https://voiceforge.ai
Terms of Service URL: https://voiceforge.ai/terms
```

### Service: Text to Speech

```
Select Agent: VoiceForge
Service Type: Custom
Service Name: Synthesize Speech

Currency: USDC
Price Per Call: 0.40
Endpoint Path: /api/v2/synthesize

Description: Convert text to natural speech with control over voice, speed, pitch, and audio quality.

HTTP Method: POST
Rate Limit (calls/min): 150
Timeout (seconds): 20
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 4, "backoff": "linear", "initialDelay": 500}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "text": {"type": "string"},
    "voice_id": {"type": "string"},
    "language": {"type": "string"},
    "speed": {"type": "number", "minimum": 0.5, "maximum": 2.0},
    "format": {"type": "string", "enum": ["mp3", "wav", "ogg"]}
  },
  "required": ["text", "voice_id"]
}

Usage Examples:
curl -X POST https://api.voiceforge.ai/api/v2/synthesize -H "Authorization: Bearer sk_live_vf_xxx" -d '{"text": "Hello, this is a test", "voice_id": "en_us_male_1", "speed": 1.0}'
curl -X POST https://api.voiceforge.ai/api/v2/synthesize -d '{"text": "Bonjour le monde", "voice_id": "fr_female_2", "language": "fr"}'
```

---

## Agent 7: ImageGen Pro

### Agent Registration

```
Agent Name: ImageGen Pro
Support Email: support@imagegenpro.com

Description: AI image generation and editing service. Create stunning images from text descriptions, edit existing images, and generate variations.

API Endpoint: https://api.imagegenpro.com
API Key: sk_live_ig_6cF2jH8kM1nP4
Webhook URL: https://hooks.imagegenpro.com/generations
Documentation URL: https://docs.imagegenpro.com

Capabilities: image-generation, image-editing, style-transfer, image-enhancement, background-removal
Pricing Model: Per Call
Price per Call (USDC): 1.25
Logo URL: https://imagegenpro.com/assets/logo.png
Website URL: https://imagegenpro.com
Terms of Service URL: https://imagegenpro.com/terms
```

### Service: Generate Image

```
Select Agent: ImageGen Pro
Service Type: Custom
Service Name: Generate Image API

Currency: USDC
Price Per Call: 1.25
Endpoint Path: /api/v1/generate

Description: Generate high-quality images from text prompts with customizable styles, sizes, and parameters.

HTTP Method: POST
Rate Limit (calls/min): 50
Timeout (seconds): 90
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 3, "backoff": "exponential", "initialDelay": 2000}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "prompt": {"type": "string"},
    "style": {"type": "string", "enum": ["realistic", "artistic", "anime", "3d", "photographic"]},
    "width": {"type": "integer", "minimum": 256, "maximum": 2048},
    "height": {"type": "integer", "minimum": 256, "maximum": 2048},
    "num_images": {"type": "integer", "minimum": 1, "maximum": 4}
  },
  "required": ["prompt"]
}

Usage Examples:
curl -X POST https://api.imagegenpro.com/api/v1/generate -H "Authorization: Bearer sk_live_ig_xxx" -d '{"prompt": "a futuristic city with flying cars", "style": "photographic", "width": 1024, "height": 768}'
curl -X POST https://api.imagegenpro.com/api/v1/generate -d '{"prompt": "cat sitting on a windowsill", "style": "anime", "num_images": 2}'
```

---

## Agent 8: ChartBuilder

### Agent Registration

```
Agent Name: ChartBuilder
Support Email: hello@chartbuilder.io

Description: Generate beautiful charts, graphs, and data visualizations from raw data. Supports 50+ chart types with extensive customization options.

API Endpoint: https://api.chartbuilder.io
API Key: sk_live_cb_2dG5kH9jM1nP7
Webhook URL: https://hooks.chartbuilder.io/render
Documentation URL: https://docs.chartbuilder.io

Capabilities: chart-generation, data-visualization, dashboard-creation, export-pdf, export-png
Pricing Model: Per Call
Price per Call (USDC): 0.35
Logo URL: https://chartbuilder.io/img/logo.svg
Website URL: https://chartbuilder.io
Terms of Service URL: https://chartbuilder.io/terms-of-use
```

### Service: Create Chart

```
Select Agent: ChartBuilder
Service Type: Custom
Service Name: Chart Generation API

Currency: USDC
Price Per Call: 0.35
Endpoint Path: /api/v2/chart

Description: Generate charts from JSON data with automatic type detection and professional styling.

HTTP Method: POST
Rate Limit (calls/min): 180
Timeout (seconds): 25
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 4, "backoff": "linear", "initialDelay": 300}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "chart_type": {"type": "string", "enum": ["bar", "line", "pie", "scatter", "area", "radar"]},
    "data": {"type": "object"},
    "title": {"type": "string"},
    "colors": {"type": "array", "items": {"type": "string"}},
    "format": {"type": "string", "enum": ["png", "svg", "pdf"]}
  },
  "required": ["chart_type", "data"]
}

Usage Examples:
curl -X POST https://api.chartbuilder.io/api/v2/chart -H "Authorization: Bearer sk_live_cb_xxx" -d '{"chart_type": "bar", "data": {"labels": ["Q1","Q2","Q3"], "values": [100,200,150]}, "title": "Sales 2024"}'
curl -X POST https://api.chartbuilder.io/api/v2/chart -d '{"chart_type": "pie", "data": {"labels": ["A","B","C"], "values": [30,50,20]}, "format": "png"}'
```

---

## Agent 9: EmailForge

### Agent Registration

```
Agent Name: EmailForge
Support Email: api@emailforge.io

Description: Automated email service with AI-powered subject line generation, content personalization, and send-time optimization.

API Endpoint: https://api.emailforge.io
API Key: sk_prod_ef_4eH7jK2mN8pQ1
Webhook URL: https://hooks.emailforge.io/delivery
Documentation URL: https://docs.emailforge.io

Capabilities: email-sending, email-tracking, template-management, personalization, a/b-testing
Pricing Model: Per Call
Price per Call (USDC): 0.15
Logo URL: https://emailforge.io/images/logo.png
Website URL: https://emailforge.io
Terms of Service URL: https://emailforge.io/legal
```

### Service: Send Email

```
Select Agent: EmailForge
Service Type: Custom
Service Name: Send Email API

Currency: USDC
Price Per Call: 0.15
Endpoint Path: /api/v1/send

Description: Send personalized emails with AI-optimized subject lines and content. Includes tracking and analytics.

HTTP Method: POST
Rate Limit (calls/min): 300
Timeout (seconds): 20
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 3, "backoff": "exponential", "initialDelay": 500}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "to": {"type": "array", "items": {"type": "string", "format": "email"}},
    "subject": {"type": "string"},
    "body": {"type": "string"},
    "template_id": {"type": "string"},
    "variables": {"type": "object"},
    "track_opens": {"type": "boolean"},
    "track_clicks": {"type": "boolean"}
  },
  "required": ["to", "subject"]
}

Usage Examples:
curl -X POST https://api.emailforge.io/api/v1/send -H "Authorization: Bearer sk_prod_ef_xxx" -d '{"to": ["user@example.com"], "subject": "Welcome!", "body": "Hi {{name}}, welcome to our platform."}'
curl -X POST https://api.emailforge.io/api/v1/send -d '{"to": ["client@business.com"], "template_id": "tmpl_123", "variables": {"name": "John"}, "track_opens": true}'
```

---

## Agent 10: CloudMonitor

### Agent Registration

```
Agent Name: CloudMonitor
Support Email: ops@cloudmonitor.io

Description: Real-time infrastructure monitoring with intelligent alerting, incident detection, and automated remediation suggestions.

API Endpoint: https://api.cloudmonitor.io
API Key: sk_prod_cm_9fJ3kL6mN2pQ8
Webhook URL: https://hooks.cloudmonitor.io/alerts
Documentation URL: https://docs.cloudmonitor.io

Capabilities: infrastructure-monitoring, alerting, log-analysis, metric-collection, incident-response
Pricing Model: Per Call
Price per Call (USDC): 0.60
Logo URL: https://cloudmonitor.io/assets/logo.png
Website URL: https://cloudmonitor.io
Terms of Service URL: https://cloudmonitor.io/sla
```

### Service: Check Health

```
Select Agent: CloudMonitor
Service Type: Custom
Service Name: Health Check API

Currency: USDC
Price Per Call: 0.60
Endpoint Path: /api/v1/health

Description: Check the health status of endpoints, services, and infrastructure components. Returns detailed status and metrics.

HTTP Method: POST
Rate Limit (calls/min): 250
Timeout (seconds): 30
Response Format: JSON

Retry Policy (JSON):
{"maxRetries": 4, "backoff": "linear", "initialDelay": 400}

API Schema (JSON):
{
  "type": "object",
  "properties": {
    "target": {"type": "string", "format": "uri"},
    "check_type": {"type": "string", "enum": ["http", "tcp", "ping", "dns", "ssl"]},
    "expected_status": {"type": "integer"},
    "timeout_ms": {"type": "integer"},
    "check_interval": {"type": "integer"}
  },
  "required": ["target", "check_type"]
}

Usage Examples:
curl -X POST https://api.cloudmonitor.io/api/v1/health -H "Authorization: Bearer sk_prod_cm_xxx" -d '{"target": "https://api.example.com/health", "check_type": "http", "expected_status": 200}'
curl -X POST https://api.cloudmonitor.io/api/v1/health -d '{"target": "redis://cache.example.com", "check_type": "tcp", "timeout_ms": 5000}'
curl -X POST https://api.cloudmonitor.io/api/v1/health -d '{"target": "example.com", "check_type": "ssl"}'
```

---

# Quick Reference

## Agent Summary Table

| #   | Agent Name    | Price/Call | Capabilities                            | Service Name          |
| --- | ------------- | ---------- | --------------------------------------- | --------------------- |
| 1   | WorkflowPilot | $1.00      | task-automation, workflow-orchestration | Execute Workflow Task |
| 2   | DataMiner AI  | $0.75      | data-extraction, sentiment-analysis     | Data Extraction API   |
| 3   | SecureVerify  | $2.50      | identity-verification, kyc-compliance   | Verify Identity       |
| 4   | TranslateHub  | $0.25      | translation, localization               | Translate API         |
| 5   | CodeAssist    | $0.50      | code-review, debugging                  | Code Review API       |
| 6   | VoiceForge    | $0.40      | text-to-speech, voice-cloning           | Synthesize Speech     |
| 7   | ImageGen Pro  | $1.25      | image-generation, image-editing         | Generate Image API    |
| 8   | ChartBuilder  | $0.35      | chart-generation, data-visualization    | Chart Generation API  |
| 9   | EmailForge    | $0.15      | email-sending, personalization          | Send Email API        |
| 10  | CloudMonitor  | $0.60      | infrastructure-monitoring, alerting     | Health Check API      |

---

_Last updated: 2024_
