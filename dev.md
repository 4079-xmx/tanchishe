帮我开发一个贪吃蛇小游戏，要浏览器运行，手机浏览器也可以打开

在项目目录运行：

cd /Users/xxx/workspace/py/tanchishe/tanchishe
python3 -m http.server 8765 --bind 0.0.0.0

然后查电脑的 Wi-Fi 局域网 IP：

ipconfig getifaddr en0

假设输出是 192.168.1.23，手机浏览器打开：

http://192.168.1.23:8765/index.html

注意几点：

- 手机和电脑必须在同一个 Wi-Fi。
- macOS 如果弹出防火墙提示，允许 Python 接收网络连接。
- 如果 en0 没有输出，可以试：

  ipconfig getifaddr en1

- 测试结束后，在运行服务器的终端按 Ctrl+C 停止。
