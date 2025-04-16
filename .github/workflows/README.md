# GitHub Actions Deployment Workflow

This repository contains GitHub Actions workflows for automating the deployment of the reservations application to production servers.

## Backend Deployment Workflow

The `deploy-backend.yml` workflow is triggered when code is pushed to the `main` branch that affects the backend (`reservations-api/`). It automatically deploys the backend to a VPS using SSH and Docker Compose.

### Required GitHub Secrets

To make the backend deployment workflow work correctly, you need to set up the following GitHub Secrets in your repository:

1. `VPS_SSH_PRIVATE_KEY`: The SSH private key for connecting to your VPS
2. `VPS_HOST`: The hostname or IP address of your VPS
3. `VPS_USER`: The SSH username for your VPS
4. `VPS_DEPLOY_PATH`: The absolute path on the VPS where the code should be deployed
5. `BACKEND_ENV_PRODUCTION`: The entire contents of your production .env file

### Setting Up Secrets

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click on "New repository secret"
4. Add each of the required secrets

### SSH Key Setup

1. Generate an SSH key pair specifically for deployment:
   ```
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
   ```

2. Add the public key to the `~/.ssh/authorized_keys` file on your VPS:
   ```
   cat ~/.ssh/github_deploy_key.pub | ssh user@your-vps "cat >> ~/.ssh/authorized_keys"
   ```

3. Add the private key to GitHub Secrets as `VPS_SSH_PRIVATE_KEY`

### VPS Prerequisites

Ensure the following is installed on your VPS:
- Docker
- Docker Compose
- rsync

### Environment Variables

The production environment variables should be stored in GitHub Secrets as `BACKEND_ENV_PRODUCTION`. This should include all the variables needed for production deployment, including:

- `NODE_ENV=production`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `NESTJS_PORT`
- Database connection variables
- Any API keys or other sensitive information

## Troubleshooting

- **Deployment Failures**: Check the GitHub Actions logs for detailed error messages
- **Container Issues**: SSH into the VPS and check Docker container logs
  ```
  docker logs reservation-api-nestjs
  ```
- **Permissions**: Ensure the VPS user has permissions to run Docker commands
  ```
  sudo usermod -aG docker $USER
  ``` 