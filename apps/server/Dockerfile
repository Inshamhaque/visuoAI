FROM node:18-bullseye

# Update package list with retry
RUN apt-get update || apt-get update

# Install essential dependencies first (smaller download)
RUN apt-get install -y --fix-missing \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install media dependencies (separate layer)
RUN apt-get update && apt-get install -y --fix-missing \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    libffi-dev \
    libgdk-pixbuf2.0-dev \
    libgirepository1.0-dev \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL Node dependencies (needed for TypeScript compilation)
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client for the correct platform
RUN npx prisma generate

# Set up Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Upgrade pip first
RUN pip install --upgrade pip

# Copy and install Python dependencies
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy all server code
COPY . .

# Build TypeScript (compile to JavaScript)
RUN npm run build

EXPOSE 3001

# Use npm start for production
CMD ["npm", "start"]