criar uma tarefa agendada para iniciar o script powershell locarsystem.ps1 na inicialização do windows sem fazer login, 

schtasks /Create /TN "LocarSystem" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F /TR "`"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoProfile -ExecutionPolicy Bypass -File `"`"C:\Locar\scripts\locarsystem.ps1`"`""





criei as tarefas agendadas abaixo para iniciar automaticamente sem fazer login, os scripts que estão anexados apenas acessam a pasta e iniciam o serviço sem logs, o problema que está acontecendo é que quando executo os arquivos no windows quando estou logado todos os serviçosbiniciam normalmente, mas quando reinicio o computador nenhum serviço é iniciado, além disso quando clico para executar as tarefas agendadas o status muda para em Execução mas os serviços não são iniciados, o path já possui o node e npm sem necessidade de informar no comando:

schtasks /Create /TN "Locar_Frontend" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F /TR "`"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoProfile -ExecutionPolicy Bypass -File `"`"C:\Locar\scripts\locar_frontend.bat`"`""

schtasks /Create /TN "Locar_Backend" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F /TR "`"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoProfile -ExecutionPolicy Bypass -File `"`"C:\Locar\scripts\locar_backend.bat`"`""

schtasks /Create /TN "Mobile_Frontend" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F /TR "`"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoProfile -ExecutionPolicy Bypass -File `"`"C:\Locar\scripts\mobile_frontend.bat`"`""

schtasks /Create /TN "Mobile_Backend" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F /TR "`"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`" -NoProfile -ExecutionPolicy Bypass -File `"`"C:\Locar\scripts\mobile_backend.bat`"`""













netstat -ano | findstr ":8080"
netstat -ano | findstr ":8081"
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"


refaça o scritp locarsystem.ps1 para executar os comandos abaixo com as portas especificadas nesta ordem: 

LOCAR

FRONTEND
--------
cd C:\Locar\frontend
npm start -- --port 3000


BACKEND
-------
cd C:\Locar\backend
node.exe server.js


PONTO MOBILE

BACKEND
-------
cd C:\controle-de-ponto-mobile-servidor-local\server
npm run dev -- --port 3001

FRONTEND
--------
cd C:\controle-de-ponto-mobile-servidor-local
npm run dev -- --port 8081 --host 0.0.0.0
















LOCAR

FRONTEND
--------
cd C:\Locar\frontend
"C:\Program Files\nodejs\npm.cmd" start -- --port 3000


BACKEND
-------
cd C:\Locar\backend
"C:\Program Files\nodejs\node.exe" server.js


PONTO MOBILE

BACKEND
-------
cd C:\controle-de-ponto-mobile-servidor-local\server
"C:\Program Files\nodejs\npm.cmd" run dev -- --port 3001

FRONTEND
--------
cd C:\controle-de-ponto-mobile-servidor-local
"C:\Program Files\nodejs\npm.cmd" run dev -- --port 8081 --host 0.0.0.0

