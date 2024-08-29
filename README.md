# RusselGPT

RusselGPT是一个基于Flask的聊天应用程序，集成了GPT模型用于对话生成。这个应用程序提供了用户注册、登录和聊天功能，并使用SQL Server数据库来存储用户信息和聊天记录。
（在开发过程中，本来要还原ChatGPT可以保存不同的Chat History并在侧边栏显示的功能，但是尝试新建聊天时或在新登录时在数据库新建一个Chat SessionID，均出现了Bug,希望在未来能够完善，如果您可以解决该问题，请你大展身手！！）

## 功能特性

- 用户注册和登录
- 与GPT模型的实时聊天
- 聊天历史记录保存
- 响应式聊天界面

## 技术栈

- 后端：Python, Flask
- 数据库：SQL Server
- 前端：HTML, CSS, JavaScript

## 项目结构

```
│
├── gpt.py                 # 主应用程序文件
├── templates/             # HTML模板目录
│   ├── login.html         # 登录页面
│   ├── register.html      # 注册页面
│   └── chat.html          # 聊天页面
├── static/                # 静态文件目录（CSS, JS, 图片等）
└── README.md              # 项目说明文件
```

## 安装和运行

1. 克隆仓库到本地：
   ```
   git clone https://github.com/你的用户名/RusselGPT.git
   cd RusselGPT
   ```

2. 安装依赖：
   ```
   pip install flask requests markdown pyodbc
   ```

3. 配置数据库连接：
   在 `gpt.py` 文件中，更新数据库连接信息：
   ```python
   conn = pyodbc.connect(
       'DRIVER={ODBC Driver 17 for SQL Server};'
       'SERVER=你的服务器名;'
       'DATABASE=你的数据库;'
       'USER=你的用户名;'
       'PASSWORD=你的密码;'
       'Trusted_Connection=yes;'
   )
   ```

4. 设置GPT API密钥：
   在 `gpt.py` 文件中，更新 `api_key` 和 `endpoint`：
   ```python
   api_key = '你的API密钥'
   endpoint = '你的API端点'
   ```

5. 运行应用：
   ```
   python gpt.py
   ```

6. 在浏览器中访问 `http://localhost:5000` 来使用应用。

## 注意事项

- 确保已安装SQL Server和相应的ODBC驱动。
- 在生产环境中，请确保正确处理敏感信息（如API密钥和数据库凭据）。
- 这个项目目前处于开发阶段，可能需要进一步的安全性和性能优化。

## 贡献

欢迎提交问题和拉取请求。对于重大更改，请先开issue讨论您想要更改的内容。


## 许可

[MIT](https://choosealicense.com/licenses/mit/)
