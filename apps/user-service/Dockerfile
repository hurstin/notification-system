# Base image
FROM node:20-alpine AS development

RUN addgroup app && adduser -S app -G app

#set user to run the app
USER app

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

#sometimes the ownership of the file in the working directory is changed to root
#to avoid this, change the onwership of the file to the root user
USER root

#change the ownership of the file to the app user
RUN chown -R app:app /usr/src/app

#change back to the app user
USER app

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Builder stage
FROM development AS builder

# Build the app - tweaked for monorepo user-service
RUN npm run build user-service

# Production image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy dist built in previous stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

# Start command tweaked for monorepo user-service
CMD ["node", "dist/apps/user-service/main"]
