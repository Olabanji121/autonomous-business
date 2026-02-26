#!/bin/bash
# Daily Deal Hunter - Run via cron at 6 AM daily
# crontab entry: 0 6 * * * /home/obanj/smart/projects/deal-hunter/daily-cron.sh

cd /home/obanj/smart/projects/deal-hunter

LOG_FILE="/home/obanj/smart/projects/deal-hunter/logs/daily-$(date +%Y-%m-%d).log"
mkdir -p logs

# Load environment variables
if [ -f /home/obanj/smart/projects/deal-hunter/.env ]; then
    export $(cat /home/obanj/smart/projects/deal-hunter/.env | grep -v '^#' | xargs)
fi

echo "========================================" >> "$LOG_FILE"
echo "Daily Deal Hunter - $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Step 1: Scrape fresh deals from Amazon
echo "[1/3] Scraping Amazon deals..." >> "$LOG_FILE"
node scraper.js >> "$LOG_FILE" 2>&1

# Step 2: Generate updated site
echo "[2/3] Generating site..." >> "$LOG_FILE"
node update-deals.js >> "$LOG_FILE" 2>&1

# Step 3: Commit to git (optional, for backup)
echo "[3/3] Committing to git..." >> "$LOG_FILE"
cd /home/obanj/smart/projects
git add -A >> "$LOG_FILE" 2>&1
git commit -m "Daily deal update $(date +%Y-%m-%d)" >> "$LOG_FILE" 2>&1
git push >> "$LOG_FILE" 2>&1

echo "Done at $(date)" >> "$LOG_FILE"
