
# Use the specified Node.js version as the base image
FROM node:20.15.0

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Nest CLI globally (if required)
RUN npm install -g @nestjs/cli

# Copy local code to the container image
COPY . .

# Expose the port
EXPOSE 3000

# Run the web service on container startup
CMD ["npm", "run", "start:dev"]
