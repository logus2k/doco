# Document Converter Game

A containerized deployment of the Document Converter game. This setup allows you to run the game environment with all dependencies pre-configured.

## Quick Start

An easy way to run Document Converter game is using **Docker Compose**. 

### 1. Prerequisites
* Install **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux). [Get Docker here](https://docs.docker.com/get-docker/).

### 2. Create the Configuration
Create a folder on your computer and save the following content into a file named `docker-compose.yml`:

```yaml
services:
  doco:
    image: logus2k/doco
    container_name: doco
    hostname: doco
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: "all"
              capabilities: [ gpu ]    
    logging:
      options:
        max-size: "10m"
        max-file: "3"
    ports:
      - "8678:8678"
    networks:
      - doco_network

networks:
  doco_network:
    driver: bridge
```

### 3. Launch the Application

Open your terminal or command prompt in that folder and run:

```bash
docker-compose up -d

```

The application will download the necessary images and start. You can now access the service via `localhost:8678`.

---

## Management Commands

**View Application Logs** If you need to check the status or troubleshoot:

```bash
docker logs -f doco

```

**Stop the Application** To stop and remove the containers (your data inside the container may be lost if not volume-mapped):

```bash
docker-compose down

```

**Update to the Latest Version** To ensure you are running the most recent version of the image:

```bash
docker-compose pull
docker-compose up -d

```

---
