# SCIMv2 Connector - Database

:no_entry: :no_entry: :no_entry: This connector is not usable for PRODUCTION. Please use it only for TEST :no_entry: :no_entry: :no_entry: 

### Work in Progress

| Id | Name | Modifications | Priority | Status |
|---|---|---|---|---|
| 20250613-1 | Add support for pagination | /core/scimRoutes.js | High | :memo: |
| 20250613-2 | Clean Up schemas with standard and complex attributes | /core/scim_utils.js<br>/scim/schemas.json | Low | :memo: |
| 20250613-3 | Add support for entitlements | /core/scim_utils.js<br>/core/scimRoutes.js<br>/scim/schemas.json<br>/scim/resourceTypes.json<br>/scim/serviceProviderConfig.json | Medium | :memo: |
| 20250613-4 | Update architecture, add documentation for basic SCIM | /README.md | Low | :memo: |
| 20250613-5 | Update authentication (switch to OAuth2.0) | /core/scimRoutes.js | High | :memo: |

### Overview

This is a SCIMv2 connector implementation working with an Oracle database. It's aim to be connected to Okta through an Okta On-Premise Provisioning (OPP) agent.

It supports only the following features : 
 - IMPORT_NEW_USERS (Endpoints: /Users & /Groups)
 - IMPORT_PROFILE_UPDATES (Endpoints: /Users & /Groups)
 - IMPORT_USER_SCHEMA (Endpoints: /ServiceProviderConfig, /ResourceTypes, /Schemas)


:rotating_light: In order for Okta to leverage the SCIMv2 standard, the SCIM connector base URL has to ends with /v2/.


![Architecture](/Okta_SCIMv2_Oracle.png "Architecture")

Refer to Okta online documentation for more [here](https://help.okta.com/en-us/content/topics/provisioning/opp/opp-create-scim-connectors.htm).

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

5. Build the database connection config file
```bash
cd /var/www/scim
vim dbconfig.json
```

The file has to contain the following elements. :warning: Password is simply encoded in base64 : this is only for dev purpose, on PROD you’ll have to add security layer.
```json
{
	"user": "<<login>>",
	"password": "<<base64pwd>>", 
	"connectString": "<<IP>>:<<PORT>>/<<DBNAME>>"
}
```

6. Systemd Service Configuration

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

7. Enable and Start the Service
```bash
sudo systemctl enable scim.service
sudo systemctl start scim.service
sudo systemctl status scim.service
```

8. Firewall Configuration (If Necessary)
```bash
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```