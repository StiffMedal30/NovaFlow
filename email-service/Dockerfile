FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

COPY ./target/libs/email-service-*.jar app.jar

EXPOSE 8050

ENTRYPOINT ["java", "-jar", "app.jar"]
