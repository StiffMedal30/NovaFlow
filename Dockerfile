# Use a minimal Java image
FROM openjdk:17-jdk-slim

# Install Git and openssh
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the built jar (make sure you build it first!)
COPY ./build/libs/config-server-*.jar app.jar

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV GIT_SSH_COMMAND="ssh -i /root/.ssh/bitbucket_rsa -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/root/.ssh/known_hosts"

# Expose the port your app runs on (adjust as needed)
EXPOSE 7090

# Run the app
ENTRYPOINT ["/entrypoint.sh"]