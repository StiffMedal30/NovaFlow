# 🛠️ Spring Cloud Config Server - SSH Key Setup

This guide explains how to configure the **Spring Cloud Config Server** to pull configuration from a **private Bitbucket repository** using SSH.

---

## ✅ Why is this needed?

The Config Server requires authentication to access a private Git repository on Bitbucket.  
We use an **SSH private key** stored in an environment variable so the server can authenticate securely.

---

## 🔐 1. Prepare Your Private SSH Key

Ensure you have your SSH private key in the following format:

```
-----BEGIN OPENSSH PRIVATE KEY-----
<your private key content here>
-----END OPENSSH PRIVATE KEY-----
```

You can find your private key here `C:\Users\<user>\.ssh\id_rsa` do not use the one that has a `.pub` extention, that's the public key that should be on bitbucket

---

## 💻 2. Set the Environment Variable in PowerShell

To **permanently** set your SSH private key for the entire system, run:

```powershell
[System.Environment]::SetEnvironmentVariable('CONFIG_SERVER_SSH_KEY', @"
-----BEGIN OPENSSH PRIVATE KEY-----
<your private key content here>
-----END OPENSSH PRIVATE KEY-----
"@, 'Machine')
```

✅ This creates a system-level environment variable called `CONFIG_SERVER_SSH_KEY`.

---

### 🧪 Verify the Variable

To confirm the variable is set correctly:

```powershell
$env:CONFIG_SERVER_SSH_KEY
```

---

## 🔒 Security Best Practices

- **Never commit your SSH key** to version control.
- For production, use a secure secrets manager:
  - **Azure Key Vault**
  - **AWS Secrets Manager**
  - **HashiCorp Vault**

---

✅ Done! Your Config Server can now securely pull configuration from your private Bitbucket repository.
