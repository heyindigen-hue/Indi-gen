#!/bin/bash
set -euo pipefail

sudo cp /opt/indigen/deploy/nginx-prod.conf /etc/nginx/sites-available/leadgen.indigenservices.com
sudo ln -sf /etc/nginx/sites-available/leadgen.indigenservices.com /etc/nginx/sites-enabled/

sudo nginx -t && sudo systemctl reload nginx
