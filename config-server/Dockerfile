# Use a minimal Java image
FROM eclipse-temurin:17-jre-jammy

# Install Git and openssh
RUN apt-get update && apt-get install -y git openssh-client && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the built jar (make sure you build it first!)
COPY ./target/libs/config-server-*.jar app.jar

ENV GIT_SSH_COMMAND="ssh -i /root/.ssh/bitbucket_rsa -o StrictHostKeyChecking=yes -o UserKnownHostsFile=/root/.ssh/known_hosts"

# Expose the port your app runs on (adjust as needed)
EXPOSE 7090

# Run the app
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
