# Use a minimal Java image
FROM eclipse-temurin:17-jre-jammy

# Set the working directory
WORKDIR /app

# Copy the built jar (make sure you build it first!)
COPY ./target/libs/chat-service-*.jar app.jar

# Expose the port your app runs on (adjust as needed)
EXPOSE 8085

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
