# SCIMv2 Connector - Database

<p align="center">
	:no_entry: :no_entry: :no_entry: This connector is not usable for PRODUCTION. Please use it only for TEST :no_entry: :no_entry: :no_entry: 
</p>

### Work in Progress

| Id | Name | Modifications | Priority | Status |
|---|---|---|---|---|
| 250613-1 | Add support for pagination | /core/scimRoutes.js | High | :memo: |
| 250613-4 | Update architecture, add documentation for basic SCIM | /README.md | Low | :memo: |
| 250613-5 | Update authentication (switch to OAuth2.0) | /utils/authn_utils.js | High | :memo: |
| 250724-1 | Add functions to push users, groups and entitlements | /core/routes/* | Low | :memo: |
| 250724-2 | Secure Basic Authentication in place | /core/routes/* | Low | :memo: |

### Overview

This is a SCIMv2 connector implementation working with an Sqlite3 local database. It's aim to be connected to Okta either using the "Governance with SCIM 2.0" application template or  through an Okta On-Premise Provisioning (OPP) agent depending on the architecture in place.

It supports only the following features : 
 - IMPORT_NEW_USERS (Endpoints: /Users & /Groups)
 - IMPORT_PROFILE_UPDATES (Endpoints: /Users & /Groups)
 - IMPORT_USER_SCHEMA (Endpoints: /ServiceProviderConfig, /ResourceTypes, /Schemas)

:rotating_light: In order for Okta to leverage the SCIMv2 standard, the SCIM connector base URL has to ends with /v2/.

![Architecture](/Okta_SCIMv2.png "Architecture")

### Deployment Guide (CentOS)

1. Update the System
```bash
sudo yum update -y
```

2. Install Node.js
```bash
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

```

3. Application Directory
```bash
sudo mkdir -p /var/www/scim
sudo chown -R $USER:$USER /var/www/scim
cd /var/www/scim
```

4. Transfer Application Files

Use Git, scp, or a file transfer tool to copy your application files to /var/www/scim.
```bash
git clone https://github.com/M3gababa/nodejsOppScim.git /var/www/scim
cd /var/www/scim
npm install
```

5. Systemd Service Configuration

Initiate the system file required for the linux service to run automatically.
```bash
sudo vim /etc/systemd/system/scim.service
```

Add the following content:
```ini
[Unit]
Description=SCIM Application Server
After=network.target

[Service]
User=<<your_username>>
WorkingDirectory=/var/www/scim
ExecStart=/usr/bin/node SCIMServer.js
Restart=always
Environment=NODE_ENV=devlopment

[Install]
WantedBy=multi-user.target
```

6. Enable and Start the Service
```bash
sudo systemctl enable scim.service
sudo systemctl start scim.service
sudo systemctl status scim.service
```

7. Firewall Configuration (If Necessary)
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```