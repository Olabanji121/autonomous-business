#!/bin/bash
# Quick manual update - scrape new deals and deploy

cd /home/obanj/smart/projects/deal-hunter

echo "🔥 Deal Hunter - Manual Update"
echo "==============================="

# Check if Camoufox is running
if ! pgrep -f "camofox" > /dev/null; then
    echo "Starting Camoufox..."
    camoufox &
    sleep 3
fi

# Run scraper
echo "Scraping deals..."
node scraper.js

# Update and deploy
echo "Updating site..."
node update-deals.js

echo ""
echo "✅ Done!"
