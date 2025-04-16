# Use a specific Node.js version
FROM node:21.7.3-slim

# Install pnpm and procps (for ps command)
RUN npm install -g pnpm && apt-get update -y && apt-get install -y procps openssl

# Set working directory
WORKDIR /usr/src/app

# Copy package management files first and install dependencies
COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

RUN pnpm add prisma

# Copy remaining application files
COPY . .

# Expose the NestJS port specified in the environment variable
EXPOSE $NESTJS_PORT

# Run the development server and prisma migrate deploy
CMD ["sh", "-c", "pnpm prisma generate && pnpm run start:dev && pnpm run prisma migrate deploy"]
