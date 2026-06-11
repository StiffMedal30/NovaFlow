FROM ollama/ollama:latest

# Install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Expose Ollama API on port 11434
EXPOSE 11434

# Start Ollama when the container runs
CMD ["ollama", "serve"]
