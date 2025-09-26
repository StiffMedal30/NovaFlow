#!/bin/bash
# Pull the model if not already downloaded
if ! ollama list models | grep -q "llama3"; then
    echo "Pulling llama3 model..."
    ollama pull llama3
fi

# Start Ollama server
exec ollama serve
