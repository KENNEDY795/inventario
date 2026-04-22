@echo off
cd /d "C:\Users\ADMIN\Desktop\PROJETO INVENTARIO\inventario\backend"
node backup.js >> "C:\Users\ADMIN\Desktop\PROJETO INVENTARIO\inventario\backups\backup.log" 2>&1
