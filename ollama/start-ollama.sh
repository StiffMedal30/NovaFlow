# # Wait for Ollama server to start (up to 60 seconds)
# timeout=60
# echo "Waiting for Ollama server to be ready..."
# for i in $(seq 1 $timeout); do
#     if wget -qO- http://localhost:11434/api/version > /dev/null; then

#         echo "Ollama server is up!"
#         break
#     fi
#     sleep 1
# done

# # Fail if still not ready
# if ! curl -s http://localhost:11434/api/version > /dev/null; then
#     echo "Error: Ollama server did not start in time"
#     exit 1
# fi
