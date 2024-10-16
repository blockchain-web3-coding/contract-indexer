# Use a more recent Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy tsconfig.json and all source files
COPY tsconfig.json ./
COPY src ./src

# Build the TypeScript code
RUN npm run build

# Expose the port the app runs on (if needed)
# EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"]