#!/bin/bash

# ============================================
# Ailexity POS - Database Backup Script
# Run daily via cron
# ============================================

BACKUP_DIR="/var/backups/ailexity-pos"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
echo "Creating backup: $DATE"
mongodump --db ailexity_pos --out $BACKUP_DIR/$DATE

# Compress backup
cd $BACKUP_DIR
tar -czf $DATE.tar.gz $DATE
rm -rf $DATE

# Remove old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup complete: $BACKUP_DIR/$DATE.tar.gz"

# To set up daily backup, add to crontab:
# crontab -e
# Add: 0 2 * * * /var/www/ailexity-pos/deploy/backup.sh
