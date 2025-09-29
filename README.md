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

## 自定义正则替换

扩展内置了一个 `regexReplacements` 列表（位于 `script.js` 中），会在消息渲染时依次执行正则替换，可用于清理 AI 输出或添加自定义气泡样式。每条规则沿用了 SillyTavern 正则导出的字段，因此可以直接把导出的 JSON 片段贴进来使用。

### 添加或修改正则的步骤

1. 打开 `script.js`，搜索 `regexReplacements` 数组。
2. 为每条规则新增一个对象，可以直接粘贴 SillyTavern 正则导出的字段。常用属性说明：
   - `id`：唯一标识，方便区分规则。
   - `scriptName`：SillyTavern 中显示的规则名称，仅用于备注。
   - `findRegex` / `regex`：要匹配的 `RegExp` 对象，可直接使用字面量（如 `/.../gi`），也可以保留 SillyTavern 导出的字符串写法（例如 `"/.../gi"`），扩展会自动解析。
   - `replaceString` / `replacement`：匹配后替换成的内容，支持多行模板字符串。
   - `placement`：限定作用的消息角色，遵循 SillyTavern 约定（`1`=用户、`2`=AI、`3`=系统、`4`=旁白，留空则对所有消息生效）。
   - `promptOnly` / `markdownOnly`：仅在提示词或 Markdown 渲染时生效，默认为兼容模式，未检测到上下文时不会强制跳过。
   - `minDepth` / `maxDepth`：按消息深度限制正则生效范围，空值表示不限制。
   - `disabled`、`runOnEdit`、`trimStrings` 等：保持与 SillyTavern 一致的字段，方便日后拓展。
3. 保存文件并在 SillyTavern 中重新加载扩展（或刷新页面）即可生效。

### 现有示例

```javascript
const regexReplacements = [
    {
        id: 'cf01534d-e108-4684-a794-fff8bee6203f',
        scriptName: '来自小图-移除思维链',
        findRegex: /(<thinking>[\s\S]*?<\/thinking>)|(<!--[\s\S]*?-->)|(<details(?:\s+close)?>\s*<summary>IF[\s\S]*?<\/details>)|(<section\s+data-id\s*=['"]?(\d+)['"]?[^>]*>([\s\S]*?)<\/section>)/gi,
        replaceString: '',
        placement: [2],
        promptOnly: true,
    },
    {
        id: '08d7874b-e7ad-4043-9729-7b18a5fb3e91',
        scriptName: 'BHL-user气泡（水滴+头像',
        findRegex: /^“(.*?)”$/gm,
        replaceString: `...自定义HTML...`,
        placement: [1],
        markdownOnly: true,
        maxDepth: 2,
    },
];
```

> 提示：如果需要暂时停用某条规则，可以将 `disabled` 设为 `true`，或直接注释掉 / 删除该对象；新增规则时注意保持数组语法正确。

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
