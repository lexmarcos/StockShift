#!/bin/bash

# Obtém o último IP
IP=$(ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{ print $2 }' | tail -n 1)

# Executa o comando substituindo o IP dinamicamente
NEXT_PUBLIC_BFF_URL="https://$IP:3000/api" next dev -H $IP --experimental-https
