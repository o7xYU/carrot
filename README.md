# SillyTavern 快速输入面板扩展

一个为 SillyTavern 设计的快速输入面板扩展，让您能够方便地插入各种格式化内容。
BunnY制作，搭配Bunnyhole Lab食用。

## 功能特点

- 🥕 **浮动按钮设计**：胡萝卜图标浮动按钮，点击即可打开输入面板
- 🎨 **INS风格界面**：半透明毛玻璃效果，优雅的视觉体验
- 📝 **多种格式支持**：
  - **时间戳**：`[时间戳] 内容`
  - **文字信息**：纯文本、图片、视频、音乐、帖子、撤回消息
  - **语音**：`=时长'|内容=`
  - **表情包**：`!表情描述|内容!`
- 🎭 **自定义表情包**：支持添加自定义表情包分类和管理
- 📜 **历史记录**：显示最近10条插入记录
- ⌨️ **斜杠命令**：支持 `/qi` 命令快速插入

## 安装方法

### 方法一：通过 SillyTavern 扩展安装器（推荐）

1. 打开 SillyTavern
2. 进入 扩展 > 管理扩展
3. 点击"安装扩展"
4. 输入此仓库地址：`https://github.com/yourusername/SillyTavern-QuickInput`
5. 点击安装

### 方法二：手动安装

1. 下载此仓库的所有文件
2. 将文件夹复制到 SillyTavern 的扩展目录：
   ```
   SillyTavern/public/scripts/extensions/third-party/quick-input-panel/
   ```
3. 重启 SillyTavern

## 使用方法

### 基本使用

1. 点击右下角的胡萝卜🥕按钮打开面板
2. 再次点击胡萝卜图标展开功能选项
3. 选择需要的功能类型
4. 输入内容
5. 点击"插入"按钮

### 功能详解

#### 时间戳
- 格式：`[2024-01-01 12:00:00] 您的内容`
- 自动添加当前时间

#### 文字信息
- **纯文本**：`"您的内容"`
- **图片**：`[描述.jpg]`
- **视频**：`[描述.mp4]`
- **音乐**：`[描述.mp3]`
- **帖子**：`[内容]`
- **撤回**：`-内容-`

#### 语音
- 格式：`=时长'|语音内容=`
- 需要输入时长（秒）和内容

#### 表情包
- 点击表情包图片直接插入
- 支持添加自定义分类
- 格式：`描述：链接`（每行一个）

### 斜杠命令

使用 `/qi` 或 `/quickinput` 命令：

```
/qi type=text 你好世界     → "你好世界"
/qi type=image 风景        → [风景.jpg]
/qi type=timestamp 记录    → [2024-01-01 12:00:00] 记录
/qi type=emoji 开心        → !开心|开心!
/qi type=voice 5|你好      → =5'|你好=
```

支持的类型：
- `timestamp` / `ts` - 时间戳
- `text` / `t` - 纯文本
- `image` / `img` - 图片
- `video` / `vid` - 视频
- `music` / `mus` - 音乐
- `voice` / `v` - 语音
- `emoji` / `e` - 表情包
- `revoke` / `r` - 撤回

## 自定义表情包

1. 点击表情包功能
2. 点击 ➕ 按钮添加新分类
3. 输入分类名称
4. 按格式输入表情包：
   ```
   开心：https://example.com/happy.png
   大笑：https://example.com/laugh.png
   ```
5. 点击确定保存

## 技术特性

- 使用 jQuery 构建，兼容 SillyTavern 环境
- 持久化存储用户自定义设置
- 响应式设计，适配不同屏幕尺寸
- 平滑动画过渡效果

## 系统要求

- SillyTavern 版本 >= 1.10.0
- 现代浏览器（Chrome、Firefox、Edge等）

## 开发者

如果您想为此扩展贡献代码：

1. Fork 此仓库
2. 创建您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 许可证

MIT License

## 致谢

感谢 SillyTavern 开发团队提供的扩展框架支持。

## 问题反馈

如果您遇到任何问题或有建议，请在 [Issues](https://github.com/yourusername/SillyTavern-QuickInput/issues) 页面提出。 

## 服务端文件持久化（SillyTavern 目录）

本扩展支持把设置写入 **SillyTavern 扩展目录**（`.../public/scripts/extensions/third-party/carrot/`）下的 `settings.json`（或你在同步面板填写的文件名）。

### 需要挂载后端接口

前端会请求以下接口之一（按顺序尝试）：

- `GET/PUT /api/plugins/carrot/settings?file=<filename>`
- `GET/PUT /api/extensions/carrot/settings?file=<filename>`

仓库已提供 `server.js`（Express Router），你可以在 SillyTavern 后端里挂载：

```js
const { router: carrotSettingsRouter } = require('./public/scripts/extensions/third-party/carrot/server.js');
app.use('/api/plugins/carrot/settings', carrotSettingsRouter);
```

挂载后行为：
- 首次读取会自动创建 `settings.json`。
- 前端新增/修改/删除会立即 `PUT` 回文件。
- 导入外部 JSON 会覆盖当前目标文件。
- 同步面板“保存”会同时下载文件，并把同样内容写回扩展目录文件。

