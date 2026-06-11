
# NovaFlow

## Prerequisites

Before running the application, ensure that the following dependencies are properly configured:

- **Java 17** or higher
- **Maven** or **Gradle** (depending on your project setup)
- **Spring Boot** (used in this project)
- **IntelliJ IDEA** (for running the app)
- **Gmail SMTP credentials** (for email sending functionality)

## Running the App

### 1. Set up the Environment Variables

Ensure the following environment variables are set before running the application:
Assuming your using gmail for sending emails.
```bash
export EMAIL_HOST=smtp.gmail.com
export EMAIL_PORT=587
export EMAIL_SMTP_AUTH=true
export EMAIL_STARTTLS=true
export EMAIL_USERNAME=your-email@gmail.com
export EMAIL_PASSWORD=your-email-password
```

You can set these environment variables either in your terminal session before running the app or add them directly to IntelliJ's Run Configuration (see below for IntelliJ setup).

### 2. IntelliJ Run Configuration

1. Open **IntelliJ IDEA**.
2. Go to `Run` > `Edit Configurations`.
3. Select your run configuration (or create a new one if none exists).
4. In the **Environment Variables** section, click on the `+` icon and add the following variables:
    - `EMAIL_HOST`: smtp.gmail.com
    - `EMAIL_PORT`: 587
    - `EMAIL_SMTP_AUTH`: true
    - `EMAIL_STARTTLS`: true
    - `EMAIL_USERNAME`: your-email@gmail.com
    - `EMAIL_PASSWORD`: your-email-password
5. Apply the changes and run the application.

### 3. Build and Run the Application

If using Maven or Gradle, you can build and run the application using your preferred method.

#### Using Gradle:
```bash
./gradlew bootRun
```

#### Using Maven:
```bash
./mvnw spring-boot:run
```

Alternatively, you can run the app directly from IntelliJ by clicking the "Run" button.

### 4. Testing the Email Functionality

Once the app is running, the user registration process will send an activation email to the user. Make sure your email account (e.g., Gmail) allows less secure apps to send emails, or use an app-specific password for Gmail accounts with 2-factor authentication.

### 5. Testing the Activation Link

When you register a new user, they will receive an email with a verification link. Clicking the link will activate their account and allow them to log in.

---

## Notes

- **Liquibase**: Ensure your database is set up correctly. The app uses Liquibase for database migrations. If you want to drop and recreate the database on startup, set `spring.liquibase.drop-first: true` in your local configuration.
  
- **Frontend Integration**: After successful account activation, the API Gateway will redirect the user to the front-end login page. You can replace the `/back/to/login/` endpoint with your actual front-end login page URL when it becomes available.

---

## Troubleshooting

If you run into issues with missing environment variables or configurations, make sure to check the IntelliJ run configuration and ensure the correct values are set.

---

Feel free to update or modify this README according to any changes you make to the project!
