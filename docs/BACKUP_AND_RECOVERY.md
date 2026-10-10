# EXAMIND — Database & Storage Backup and Disaster Recovery Runbook

## 1. Overview

This document outlines the backup, retention, and disaster recovery procedures for the EXAMIND platform.

The system relies on two critical stateful assets:
1. **PostgreSQL Relational Database (`examind`)**: Users, exams, questions, rubrics, submissions, evaluations, versions, results, and notifications.
2. **Persistent Answer Sheet Storage (`/app/uploads`)**: Student uploaded answer documents (PDFs, JPGs, PNGs).

---

## 2. Automated PostgreSQL Backups

### 2.1 Daily Logical Dump Script (`pg_dump`)

Create `/usr/local/bin/examind-backup.sh`:
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/examind"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="examind-postgres"
DB_NAME="examind"
DB_USER="examind_user"

mkdir -p "${BACKUP_DIR}"

echo "Starting EXAMIND PostgreSQL backup at $(date)..."

docker exec -t ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} -Fc \
    > "${BACKUP_DIR}/examind_db_${TIMESTAMP}.dump"

# Retain backups for 30 days
find "${BACKUP_DIR}" -type f -name "examind_db_*.dump" -mtime +30 -delete

echo "Backup completed successfully: ${BACKUP_DIR}/examind_db_${TIMESTAMP}.dump"
```

### 2.2 Cron Automation
Add to server crontab (`crontab -e`):
```cron
# Run daily at 02:00 AM UTC
0 2 * * * /usr/local/bin/examind-backup.sh >> /var/log/examind_backup.log 2>&1
```

---

## 3. Uploaded Files Volume Backup

The `/app/uploads` storage volume contains student scan uploads. Use `rsync` or cloud storage sync:

```bash
# Sync local upload volume to remote S3 bucket
aws s3 sync /var/lib/docker/volumes/examind_file_uploads/_data s3://examind-prod-backups/uploads/ \
    --sse AES256 --delete
```

---

## 4. Disaster Recovery & Restoration Procedures

### 4.1 Database Restoration from Dump File

```bash
# 1. Stop backend services to avoid concurrent writes
docker compose stop backend

# 2. Drop existing database connections and recreate database
docker exec -it examind-postgres psql -U examind_user -d postgres -c "DROP DATABASE IF EXISTS examind;"
docker exec -it examind-postgres psql -U examind_user -d postgres -c "CREATE DATABASE examind OWNER examind_user;"

# 3. Restore dump file using pg_restore
docker exec -i examind-postgres pg_restore -U examind_user -d examind -v < /var/backups/examind/examind_db_YYYYMMDD_HHMMSS.dump

# 4. Restart backend container (Flyway validates schema on boot)
docker compose start backend
```

### 4.2 Verifying Recovery Integrity
```bash
# Check table count and row count of latest submissions
docker exec -it examind-postgres psql -U examind_user -d examind -c "SELECT COUNT(*) FROM submissions;"
docker exec -it examind-postgres psql -U examind_user -d examind -c "SELECT COUNT(*) FROM results;"
```

