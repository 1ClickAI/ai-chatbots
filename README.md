
# 🌟 OneChat by 1Click.AI 🚀

Welcome to **OneChat** – a powerful, easy-to-use instance server system developed by **[1Click.AI](https://1click.ai)**. 🎉 This repository provides everything you need to set up and manage your own instance server for seamless WhatsApp automation. 

---

## ✨ Features
- 🟢 **Create and Manage Instances**: Spin up new instances and control them effortlessly.
- 🔒 **Secure API**: Protect your instance server with an API key.
- 🌐 **OneChat API Documentation**: Explore all API routes with an easy-to-use interface.
- 📊 **Instance Dashboard**: Includes a beautiful, responsive dashboard to monitor and manage instances.
- 💾 **Persistent Sessions**: Sessions are saved to ensure uninterrupted service.
- 🔄 **Docker Ready**: Deploy effortlessly using Docker Compose.

---

## 🎯 What is OneChat?

**OneChat** is an advanced WhatsApp instance management system designed for developers and businesses to control multiple instances of WhatsApp. It's backed by the power of **1Click.AI**'s cutting-edge infrastructure and is highly customizable to fit your automation needs.

With **OneChat**, you can:
- Manage instances in real time.
- Integrate with your own systems using the secure API.
- Streamline operations with webhooks and automation.

---

## 🚀 Getting Started

### Prerequisites
1. **Docker & Docker Compose**: Make sure Docker and Docker Compose are installed.
2. **Node.js**: For local development, install Node.js (if not using Docker).
3. **Git**: Ensure Git is installed to clone the repository.

---

## 🔧 Installation

### Using Docker 🐳

1. **Clone this repository**:
   ```bash
   git clone https://github.com/1clickai/onechat.git
   cd onechat
   ```

2. **Run the containers**:
   ```bash
   docker-compose up -d
   ```

3. Access your instance server:
   - Dashboard & Backend: [http://localhost:3000](http://localhost:3000)

---

### Using EasyPanel 🚀

To deploy using **EasyPanel**, you can use the following JSON schema:

```json
{
    "services": [
        {
            "type": "app",
            "data": {
                "projectName": "onechat",
                "serviceName": "onechat-api",
                "source": {
                    "type": "image",
                    "image": "ghcr.io/1clickai/onechat:latest"
                },
                "domains": [
                    {
                        "host": "$(EASYPANEL_DOMAIN)",
                        "port": 31000
                    }
                ],
                "env": "SERVER_URL=http://localhost:31000\nAPI_KEY=yourapikey\nDB_CONNECTION_STRING=\nPROXY_HOST=\nPROXY_PORT= \nPROXY_PROTOCOL=\nPROXY_USERNAME=\nPROXY_PASSWORD=\nLOG_LEVEL=warn",
                "mounts": [
                    {
                        "type": "volume",
                        "name": "node_sessions",
                        "mountPath": "/app/sessions"
                    }
                ]
            }
        },
        {
            "type": "postgres",
            "data": {
                "projectName": "onechat",
                "serviceName": "onechat-db",
                "image": "postgres:16",
                "password": "secret"
            }
        }
    ]
}
```

1. In EasyPanel, import the JSON schema above.
2. For the `DB_CONNECTION_STRING` in **onechat-api**, copy the **Internal Connection URL** from **onechat-db** (found under Credentials).
3. Paste the URL into `DB_CONNECTION_STRING` in the environment settings of **onechat-api**.
4. Save the changes and restart the services.

---

## 📖 OneChat API Documentation

Explore all API endpoints provided by OneChat.

### Example API Routes:
1. **Create Instance**:
   ```bash
   curl -X POST http://localhost:3000/api/instances \
        -H "Authorization: Bearer yourapikey" \
        -H "Content-Type: application/json" \
        -d '{"udid": "unique-id-123"}'
   ```

2. **Get QR Code**:
   ```bash
   curl -X GET http://localhost:3000/api/instances/unique-id-123/qr \
        -H "Authorization: Bearer yourapikey"
   ```

3. **Delete Instance**:
   ```bash
   curl -X DELETE http://localhost:3000/api/instances/unique-id-123 \
        -H "Authorization: Bearer yourapikey"
   ```

4. **Update Webhook**:
   ```bash
   curl -X PATCH http://localhost:3000/api/instances/unique-id-123/webhook \
        -H "Authorization: Bearer yourapikey" \
        -H "Content-Type: application/json" \
        -d '{"webhook": "https://your-webhook-url.com"}'
   ```

5. **Disconnect Instance**:
   ```bash
   curl -X POST http://localhost:3000/api/instances/unique-id-123/disconnect \
        -H "Authorization: Bearer yourapikey"
   ```

---

## 🌈 Features Overview

### 📊 Responsive Dashboard
Manage your instances visually through an elegant, responsive UI. 

### 🔐 Secure API
Your instance server is protected with API key validation to ensure unauthorized users can't access it.

### 📤 Webhook Integration
Receive real-time updates for messages and instance status using webhooks.

---

## 🌍 Environment Variables

Customize your deployment using the following environment variables:

| Variable               | Description                               | Default          |
|-------------------------|-------------------------------------------|------------------|
| `SERVER_URL`           | Base URL for the server                  | `http://localhost:3000` |
| `API_KEY`              | The API key for secure access            | `yourapikey`     |
| `DB_CONNECTION_STRING` | Database connection string               | `postgresql://onechatuser:secret@db:5432/onechatdb` |
| `PROXY_HOST`           | Proxy hostname                           |                  |
| `PROXY_PORT`           | Proxy port                               |                  |
| `PROXY_PROTOCOL`       | Proxy protocol (e.g., http, https)       |                  |
| `PROXY_USERNAME`       | Proxy username                           |                  |
| `PROXY_PASSWORD`       | Proxy password                           |                  |
| `LOG_LEVEL`            | Logging level (e.g., warn, info)         | `warn`           |

---

## 🐳 Docker Image Available on GitHub Container Registry!

The official Docker image of OneChat is now available on the GitHub Container Registry. 🚀

### Pull the image

You can pull the latest version of the OneChat Docker image using the following command:

```bash
docker pull ghcr.io/1clickai/onechat:latest
```

### Run the container

To run the container, use:

```bash
docker run -d -p 3000:3000 --name onechat ghcr.io/1clickai/onechat:latest
```

Replace `3000:3000` with the appropriate port mapping for your setup.

Stay tuned for updates and improvements! 😊

---

## 🛠️ Contributing

We welcome contributions to **OneChat**! Please fork the repository and submit a pull request. 🤝

---

## 🌟 About 1Click.AI

**1Click.AI** specializes in developing AI-driven solutions for businesses worldwide. Our mission is to create tools that streamline operations and boost productivity. **OneChat** is just one of the many innovative solutions we offer. 

For more information, visit our website at [1Click.AI](https://1click.ai). 🌐

---

## ⚡ Support

If you encounter any issues, feel free to open an issue in this repository or contact us via email at `info@1click.ai`.

---

### 🎉 Happy Automating with OneChat!
