Capstone Project 2 — Docker, AWS & Real-World DevOps Deployment

A simple Employee Registration App used to demonstrate a full containerized 3-tier stack:

Browser → [Frontend: Nginx + HTML/JS]  →  [Backend: Node/Express API]  →  [Database: MongoDB]

All three services are defined in one docker-compose.yml and deployed to a single AWS EC2 instance.

Project Structure
capstone/
├── docker-compose.yml
├── backend/
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
└── frontend/
    ├── index.html
    ├── style.css
    ├── app.js
    ├── nginx.conf
    └── Dockerfile
Part 1 — Run It Locally First (always test before deploying)
Install Docker Desktop (includes Docker Compose) on your laptop.
Open a terminal in the capstone/ folder.
Build and start everything:
bash
   docker compose up --build
Open your browser to http://localhost — you should see the Employee Registration form.
Fill in the form (name, email, phone, department, designation, date of joining) and submit — the employee should appear in the table below.
Check health endpoints:
bash
   curl http://localhost/api/employees
   curl http://localhost:80
   docker inspect --format='{{json .State.Health}}' capstone-backend
Stop everything:
bash
   docker compose down

Add -v if you also want to wipe the database volume.

If it works locally, you're ready to deploy — don't skip this step, it's much easier to debug on your own machine than on a remote server.

Part 2 — Push Code to GitHub

If you already created an empty repo on GitHub, initialize git inside the capstone/ folder itself (not in a subfolder — cloning the empty repo separately and forgetting to move your files into it is a common mixup):

bash
cd capstone
git init
git add .
git commit -m "Add employee registration app with Docker Compose setup"
git branch -M main
git remote add origin git@github.com:<your-username>/<your-repo>.git
git push -u origin main

Already cloned the empty repo into a subfolder by mistake? Move its hidden .git folder up one level, then delete the empty subfolder:

bash
mv <cloned-repo-folder>/.git .
rm -rf <cloned-repo-folder>
git status   # should now show your project files as untracked

Keep committing as you go (e.g. "Fix healthcheck", "Add nginx proxy") — a clean commit history is part of the submission requirement.

Part 3 — Launch an AWS EC2 Instance
Log in to the AWS Console → EC2 → Launch Instance.
Configuration:
Name: capstone-devops
AMI: Ubuntu Server 22.04 LTS
Instance type: t2.micro (free tier eligible)
Key pair: create a new one, download the .pem file, keep it safe
Security Group — this is the "firewall" for your instance. Add these inbound rules:
Type	Port	Source
SSH	22	My IP (not 0.0.0.0/0, for security)
HTTP	80	0.0.0.0/0 (anyone can view the app)
Launch the instance, note its Public IPv4 address.
Part 4 — Connect and Install Docker on EC2

SSH into the instance:

bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

Install Docker + Compose plugin:

bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

Log out and back in (exit then SSH again) so the group change applies.

Verify:

bash
docker --version
docker compose version
Part 5 — Deploy the App on EC2

Clone your repo onto the instance:

bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

Build and run in detached mode:

bash
docker compose up --build -d

Check that all 3 containers are healthy:

bash
docker compose ps

You should see frontend, backend, and mongo all Up (and healthy once the health checks pass).

Part 6 — Verify From Outside

In your own browser, go to:

http://<EC2-PUBLIC-IP>

You should see the Employee Registration form, live on the internet. Register an employee, refresh, remove it — confirming frontend → backend → database is all wired correctly.

Quick checks:

bash
curl http://<EC2-PUBLIC-IP>/api/employees   # backend API via nginx proxy
docker compose logs backend --tail=50       # backend logs
docker compose logs mongo --tail=50         # database logs
Part 7 — Prove It Survives Restarts (a key capstone requirement)
bash
# Simulate a crash
docker restart capstone-backend

# Or reboot the whole EC2 instance
sudo reboot

After reboot, SSH back in and run:

bash
docker compose ps

Because every service in docker-compose.yml has restart: unless-stopped, containers should come back up automatically. If they don't restart automatically after a full instance reboot, run:

bash
docker compose up -d

(To make containers survive an EC2 reboot without manual intervention, enable the Docker service on boot — already done via systemctl enable docker above — and containers with restart: unless-stopped will auto-start with the daemon.)

Part 8 — Logging & Observability
Each service uses the json-file logging driver with rotation (max-size: 10m, max-file: 3) so logs don't fill the disk.
View live logs any time:
bash
  docker compose logs -f
Health checks are built into backend (/health endpoint), mongo (mongosh ping), and frontend (Nginx root response), all visible via docker compose ps.
Part 9 — What to Submit
 GitHub repo link (with this README, all Dockerfiles, and docker-compose.yml)
 Screenshots: app running in browser at the EC2 public IP, and docker compose ps showing healthy containers
 Clean commit history showing incremental progress
 (Optional) LinkedIn post describing what you built and learned
Common Issues & Fixes
Problem	Likely Cause	Fix
Can't reach app in browser	Security group missing port 80 rule	Add inbound rule for HTTP/80
docker compose up fails with permission denied	User not in docker group yet	Log out/in after usermod -aG docker $USER
Backend keeps restarting	Mongo not ready yet	Compose already handles this via depends_on: condition: service_healthy — check docker compose logs backend
Frontend loads but Add button does nothing	/api proxy misconfigured	Check frontend/nginx.conf points to http://backend:5000/api/
Changes not showing after git pull	Old images cached	Run docker compose up --build -d to rebuild
frontend (or backend) container stuck unhealthy, but the app works fine in the browser	wget inside the Dockerfile's HEALTHCHECK resolves localhost to the IPv6 loopback (::1) first, which nothing is listening on	Change the healthcheck's URL from http://localhost:<port> to http://127.0.0.1:<port> in the Dockerfile (and in docker-compose.yml for the backend) to force IPv4
git status says "not a git repository" right after git cloneing your empty GitHub repo	You cloned into a new subfolder instead of turning your project folder itself into the git repo	mv <cloned-folder>/.git . then rm -rf <cloned-folder>, run from inside your project folder
