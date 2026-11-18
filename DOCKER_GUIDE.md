# Docker setup for heat-CDD

These files add container/deployment configuration only. They do not edit the existing Python, HTML, CSS, or JavaScript application files.

## Local run on macOS

1. Install Docker Desktop for Mac with Apple silicon, launch it, and wait until the engine is running.
2. Extract these files into the root of your cloned `heat-CDD` repository, preserving the folders. The `backend/Dockerfile` and `frontend/Dockerfile` should sit beside the existing backend/frontend files.
3. From the repository root, run:

```bash
docker --version
docker compose version
docker run --rm hello-world
docker compose config
docker compose up --build -d
```

4. Open `http://localhost:8080` for the app and `http://localhost:8000/docs` for FastAPI Swagger docs.
5. View logs with `docker compose logs -f`; stop with `docker compose down`.

The named `heat_cdd_data` volume keeps `backend/data` persistent. `docker compose down -v` deletes that volume and its data; do not use it unless you intentionally want to reset the database/data.

## VPS deployment with HTTPS

1. Use an Ubuntu 24.04 LTS VPS. Install Docker Engine and the Docker Compose plugin using Docker's official Ubuntu instructions.
2. Point a DNS A record for your chosen hostname to the VPS public IPv4 address. Allow inbound TCP ports 22, 80, and 443 at the VPS provider firewall.
3. Clone the repository on the VPS and copy these Docker configuration files into its root, then create a `.env` file in the repository root containing:

```env
SITE_ADDRESS=app.example.com
```

Replace `app.example.com` with your real hostname.
4. Run:

```bash
sudo docker compose --profile production up --build -d
sudo docker compose ps
sudo docker compose logs -f
```

Caddy obtains/renews HTTPS certificates for the hostname and forwards traffic to the frontend container. Nginx then forwards `/api/` and `/optimize` to FastAPI. The backend port is bound to loopback only.

To deploy later code/config changes:

```bash
git pull origin main
sudo docker compose --profile production up --build -d
```

Do not deploy real personal or sensitive data with the current application authentication as-is. Review the demo/default credentials and plaintext password storage before using this beyond a classroom demonstration.
