#!/bin/bash

# 测试飞书Webhook的脚本
# 使用方法: ./scripts/test-feishu-webhook.sh YOUR_WEBHOOK_URL

if [ -z "$1" ]; then
    echo "❌ 请提供飞书Webhook URL"
    echo "使用方法: $0 YOUR_WEBHOOK_URL"
    exit 1
fi

WEBHOOK_URL="$1"

echo "🧪 测试飞书Webhook..."

# 先测试简单文本消息
echo "第1步：测试简单文本消息..."
response1=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "msg_type": "text",
    "content": {
      "text": "🧪 飞书Webhook测试消息 - 这是一条简单的测试消息"
    }
  }')

echo "简单消息响应: $response1"

# 再测试交互式卡片消息
echo "第2步：测试交互式卡片消息..."
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
response2=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"msg_type\": \"interactive\",
    \"card\": {
      \"elements\": [
        {
          \"tag\": \"div\",
          \"text\": {
            \"content\": \"🧪 **Webhook测试**\\n\\n这是一条测试消息，用于验证飞书通知是否正常工作。\",
            \"tag\": \"lark_md\"
          }
        },
        {
          \"tag\": \"hr\"
        },
        {
          \"tag\": \"div\",
          \"text\": {
            \"content\": \"**时间**: $CURRENT_TIME\\n**项目**: Legnext Midjourney API\",
            \"tag\": \"lark_md\"
          }
        }
      ],
      \"header\": {
        \"title\": {
          \"content\": \"🧪 Webhook测试通知\",
          \"tag\": \"plain_text\"
        },
        \"template\": \"blue\"
      }
    }
  }")

echo "卡片消息响应: $response2"

# 检查响应结果
if [[ "$response1" == *'"code":0'* ]] || [[ "$response2" == *'"code":0'* ]]; then
    echo "✅ 测试消息发送成功！请检查飞书群聊是否收到消息。"
elif [[ "$response1" == *'"code"'* ]]; then
    echo "❌ 测试消息发送失败！"
    echo "错误详情: $response1"
    echo "常见错误解决方案:"
    echo "  - 9499: 消息格式错误，请检查JSON格式"
    echo "  - 19024: webhook URL无效或已过期"
    echo "  - 19001: 缺少必要参数"
    exit 1
else
    echo "✅ 请求发送成功，请检查飞书群聊是否收到消息。"
fi