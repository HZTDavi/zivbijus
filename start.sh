#!/bin/bash
# Script para iniciar Zivbijus (Backend e Frontend)

echo "Iniciando Servidor Backend..."
cd server && npm run dev &

echo "Iniciando Frontend Client..."
cd client && npm run dev &

wait
