# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install system dependencies required for canvas package and build tools
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    make \
    g++ \
    python3 \
    py3-pip \
    build-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Expose the development server port (Quasar default is 8081)
EXPOSE 8081

# Start the development server
CMD ["yarn", "dev"]
