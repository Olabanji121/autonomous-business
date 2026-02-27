#!/bin/bash
# Full Traffic Automation - Generate and prepare posts for all channels

# Set up Node environment for cron
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
export PATH="$HOME/.nvm/versions/node/v25.6.1/bin:$PATH"

cd /home/obanj/smart/projects/deal-hunter

DATE=$(date +%Y-%m-%d)
OUTPUT_DIR="/home/obanj/smart/projects/deal-hunter/posts/$DATE"

mkdir -p "$OUTPUT_DIR"

echo "🔥 Generating traffic content for $DATE..."

# Generate all posts
node traffic.js reddit > "$OUTPUT_DIR/reddit.txt"
node traffic.js twitter > "$OUTPUT_DIR/twitter.txt"
node traffic.js telegram > "$OUTPUT_DIR/telegram.txt"
node traffic.js facebook > "$OUTPUT_DIR/facebook.txt"

# Create summary
echo "✅ Posts generated in $OUTPUT_DIR"
echo ""
echo "Files:"
ls -la "$OUTPUT_DIR"

# Post to Telegram if channel is set up
if [ -n "$TELEGRAM_CHANNEL" ] && [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo ""
    echo "Posting to Telegram..."
    MSG=$(node traffic.js telegram)
    curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=$TELEGRAM_CHANNEL" \
        -d "parse_mode=HTML" \
        -d "text=$MSG" \
        -d "disable_web_page_preview=false"
fi

echo ""
echo "📋 To post manually:"
echo "   Reddit:     cat $OUTPUT_DIR/reddit.txt"
echo "   Twitter:   cat $OUTPUT_DIR/twitter.txt"
echo "   Telegram: cat $OUTPUT_DIR/telegram.txt"
echo "   Facebook: cat $OUTPUT_DIR/facebook.txt"
