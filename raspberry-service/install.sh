#!/bin/bash

echo "Installing GrowRoom Service..."

# Update system
sudo apt-get update

# Install Python dependencies
sudo apt-get install -y python3-pip python3-dev

# Install Python packages
pip3 install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file - please configure it!"
fi

# Install systemd service
sudo cp growroom.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. sudo systemctl enable growroom"
echo "3. sudo systemctl start growroom"
