# Capstone Project 2 - Employee Registration App

This is my capstone project for the DevOps course. The idea was to take a simple full-stack app, containerize it with Docker, and actually deploy it on AWS instead of just running it on my laptop.

## What it does

It's a basic Employee Registration app. You fill in a form (name, email, phone, department, designation, date of joining) and it gets saved to a database. There's a table below the form that shows everyone who's registered so far, and you can remove entries too.

Nothing fancy on the UI side - the point of this project was the DevOps part, not the design.

## Tech stack

- Frontend: plain HTML/CSS/JS, served by Nginx
- Backend: Node.js + Express
- Database: MongoDB
- All three run in separate Docker containers, tied together with Docker Compose
- Deployed on an AWS EC2 instance (Ubuntu)

## Project structure

```
capstone-2/
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
```

## How to run it locally

1. Make sure Docker and Docker Compose are installed.
2. Clone the repo and go into the folder.
3. Run:
   ```bash
   docker compose up --build
   ```
4. Open your browser at `http://localhost`. You should see the registration form.
5. To stop it:
   ```bash
   docker compose down
   ```

If you want to check things are working under the hood:
```bash
curl http://localhost/api/employees
docker compose ps
```

## How I deployed it on AWS

1. Launched a `t2.micro` EC2 instance running Ubuntu, using a key pair I already had.
2. In the security group, opened port 22 (SSH, only from my IP) and port 80 (HTTP, open to everyone so the app is actually reachable).
3. SSH'd into the instance and installed Docker + the Compose plugin:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker $USER
   ```
   (had to log out and back in for that last command to actually take effect)
4. Cloned the repo onto the instance and ran the same command as local:
   ```bash
   git clone https://github.com/CodeWithRaj2157/capstone-2-employee-app.git
   cd capstone-2-employee-app
   docker compose up --build -d
   ```
5. Checked `docker compose ps` until all three containers said healthy, then opened the EC2 public IP in my browser to confirm it actually works from the outside, not just inside the box.
