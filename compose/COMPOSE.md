# Docker Scripts Usage Manual

This repository contains scripts to manage Docker containers and images for the **Document Converter** game. Below is a guide on how to use each script.

---

## Table of Contents
- [Docker Scripts Usage Manual](#docker-scripts-usage-manual)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Script Descriptions](#script-descriptions)
    - [start.sh / start.bat](#startsh--startbat)
    - [stop.sh / stop.bat](#stopsh--stopbat)
    - [rebuild\_all.sh / rebuild\_all.bat](#rebuild_allsh--rebuild_allbat)
    - [update.sh / update.bat](#updatesh--updatebat)
    - [remove\_all.sh / remove\_all.bat](#remove_allsh--remove_allbat)
  - [Usage Examples](#usage-examples)
    - [Example 1: Start the Application](#example-1-start-the-application)
    - [Example 2: Rebuild All Images](#example-2-rebuild-all-images)
  - [Notes](#notes)

---

## Prerequisites
- Docker and Docker Compose installed.
- Ensure all scripts are executable (Linux/macOS: `chmod +x *.sh`).
- Scripts assume the Dockerfiles (`doco.server.Dockerfile` and `doco.Dockerfile`) are in the same directory.

---

## Script Descriptions

### start.sh / start.bat
**Purpose**: Starts the Document Converter game container.

**Usage**:
```bash
./start.sh        # Linux/macOS
start.bat         # Windows
```

**Output**:
- Confirms if the container is running.
- Provides the URL to access the application: [http://localhost:8678](http://localhost:8678).

---

### stop.sh / stop.bat
**Purpose**: Stops the Document Converter game container.

**Usage**:
```bash
./stop.sh         # Linux/macOS
stop.bat          # Windows
```

**Output**:
- Confirms if the container is stopped and removed.

---

### rebuild_all.sh / rebuild_all.bat
**Purpose**: Stops containers, removes both `doco.server:1.0` and `doco:1.0` images, and rebuilds them.

**Usage**:
```bash
./rebuild_all.sh  # Linux/macOS
rebuild_all.bat   # Windows
```

**Output**:
- Confirms each step: stopping containers, removing images, and rebuilding.
- Instructs to run `start.sh`/`start.bat` to start the containers.

---

### update.sh / update.bat
**Purpose**: Removes and recreates only the `doco:1.0` image and its containers.

**Usage**:
```bash
./update.sh       # Linux/macOS
update.bat        # Windows
```

**Output**:
- Confirms each step: stopping containers, removing the image, and rebuilding.
- Instructs to run `start.sh`/`start.bat` to start the containers.

---

### remove_all.sh / remove_all.bat
**Purpose**: Stops containers and removes both `doco.server:1.0` and `doco:1.0` images.

**Usage**:
```bash
./remove_all.sh   # Linux/macOS
remove_all.bat    # Windows
```

**Output**:
- Confirms containers and images are removed.

---

## Usage Examples

### Example 1: Start the Application
```bash
./start.sh
```
**Output**:
```
The Document Converter game was successfully STARTED.
You can now access it at http://localhost:8678 using your browser.
Run stop.sh when you wish to stop the application.
```

---

### Example 2: Rebuild All Images
```bash
./rebuild_all.sh
```
**Output**:
```
Checking image: doco.server:1.0
Image 'doco.server:1.0' exists. Proceeding to stop containers and remove the image.
The Document Converter game was STOPPED.
Image 'doco.server:1.0' removed.
Rebuilding image 'doco.server:1.0'...
Image 'doco.server:1.0' rebuilt.
...
Rebuild complete. Run './start.sh' to start the containers.
```

---

## Notes
- **Permissions**: Ensure scripts are executable on Linux/macOS (`chmod +x *.sh`).
- **Dockerfiles**: Verify the Dockerfiles (`doco.server.Dockerfile` and `doco.Dockerfile`) are in the correct directory.
- **Error Handling**: Scripts provide feedback for errors (e.g., container not running, image not found).

---
