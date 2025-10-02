# Use a minimal Java image
FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the built jar (make sure you build it first!)
COPY ./build/libs/chat-service-*.jar app.jar

# Expose the port your app runs on (adjust as needed)
EXPOSE 8085

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]