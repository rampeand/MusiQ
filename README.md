<div align="center">
  
# 🎵 MusiQ 🎵
  
**The Ultimate Online Jukebox for Your Gatherings**

[![Docker Image CI](https://github.com/rampeand/musiq/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/rampeand/musiq/actions/workflows/docker-publish.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/rampeand/musiq)](https://hub.docker.com/r/rampeand/musiq)

*Let everyone be the DJ.*
</div>

---

## 🌟 Overview

**MusiQ** is an interactive, shared music video jukebox designed to elevate your parties, hangouts, and gatherings. Forget passing the aux cord—MusiQ empowers everyone to search for their favorite tracks and add them directly to a collaborative, real-time playlist. 

Whether you're hosting a house party, working in an office, or relaxing with friends, MusiQ keeps the vibes perfectly tuned to the crowd.

## ✨ Features

- **Real-Time Collaboration:** Multiple users can queue up songs simultaneously from their own devices.
- **Shared Experience:** Everyone enjoys listening to the same song playing on the host device.
- **Fair Play:** A smart cueing system ensures everyone gets their turn to hear their requested song.
- **Modern UI:** Sleek, responsive design that looks great on both desktop and mobile devices.
- **Guest Queue Mode:** Dedicated screens for guests to seamlessly queue songs without interrupting the main media player.

## 🐳 Getting Started (Docker)

MusiQ is fully containerized and incredibly easy to deploy using Docker!

### Quick Start with Docker CLI

You can spin up the application in seconds by pulling the pre-built image from Docker Hub:

```bash
docker run -d \
  --name musiq-app \
  -p 8080:8080 \
  rampeand/musiq:latest
```

The app will now be available locally at `http://localhost:8080`.

### Running with Docker Compose

If you prefer using Docker Compose, create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  musiq:
    image: rampeand/musiq:latest
    container_name: musiq-server
    ports:
      - "8080:8080"
    restart: unless-stopped
```

Then simply start it in the background:
```bash
docker compose up -d
```

## 🛠️ Local Development

If you'd like to run MusiQ locally without Docker or contribute to the source code:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rampeand/musiq.git
   cd musiq
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the application:**
   ```bash
   node app.js
   ```

## 🧪 Testing

To run the automated suite of functional tests:

```bash
npm test
```

---

## 📜 License

This project is distributed under the BSD-3-Clause License. See the [LICENSE](LICENSE) file for more information.

---

<div align="center">
  <i>Built with ❤️ by Andre Rampersad</i>
</div>
