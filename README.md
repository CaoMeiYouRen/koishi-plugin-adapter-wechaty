<h1 align="center">@cao-mei-you-ren/koishi-plugin-adapter-wechaty </h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/koishi-plugin-adapter-wechaty/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D16-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> Koishi Wechaty 适配器
>
> 本项目是原 [koishi-plugin-adapter-wechaty](https://code.mycard.moe/3rdeye/koishi-plugin-adapter-wechaty) 的修复版，在最新的 koishi@4.15.7 可用

## 🏠 主页

[https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty#readme](https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty#readme)


## 📦 依赖要求


- node >=16
- koishi >= 4.15.7

## 🚀 安装

### 插件市场安装

![image-20231207155658055](https://cmyr-picgo.cmyr.ltd/images/202312071557173.png?x-oss-process=style/compressed-picture)

前往插件市场搜索 `@cao-mei-you-ren/adapter-wechaty` 然后安装即可。

**Tips**：被提示为`不安全`是正常的，具体原因可见：[应当避免的情况](https://koishi.chat/zh-CN/cookbook/design/storage.html#%E5%BA%94%E5%BD%93%E9%81%BF%E5%85%8D%E7%9A%84%E6%83%85%E5%86%B5)。

> 简而言之就是 wechaty 这个包本身用到了基于 gyp 的包，故依赖 wechaty 的本项目也被提示 **不安全**

### 手动安装

```sh
npm install @cao-mei-you-ren/koishi-plugin-adapter-wechaty
```

## 👨‍💻 使用

前往插件页面按照引导完成配置

![image-20231207154722362](https://cmyr-picgo.cmyr.ltd/images/202312071547470.png?x-oss-process=style/compressed-picture)

### name

注意，`name` 字段在启用多个插件实例的时候不可重复！

### puppet

默认为 `wechaty-puppet-wechat`。

详见：https://wechaty.js.org/zh/docs/specs/puppet

### selfId

机器人自身 ID，用于比对是否为机器人自身的消息。

注意和微信号不同。

### ioToken

详见：https://wechaty.js.org/zh/docs/puppet-services/tokens

### wechaty-puppet-wechat

启动插件，并在 Koishi 控制台的『日志』或是 stdout 中查看二维码，扫描登录。

## 🛠️ 开发

```sh
npm run dev
```

## 🔧 编译

```sh
npm run build
```

## 🔍 Lint

```sh
npm run lint
```

## 💾 Commit

```sh
npm run commit
```


## 👤 作者

**CaoMeiYouRen**

* Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)

* GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 贡献/提问

欢迎 贡献、提问或提出新功能！<br />如有问题请查看 [issues page](https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty/issues). <br/>贡献或提出新功能可以查看[contributing guide](https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty/blob/master/CONTRIBUTING.md).

### 关于问题反馈的额外说明

可以向本项目提出问题和反馈，但不一定能得到解决。

由于本项目的核心代码都是从[原项目](https://code.mycard.moe/3rdeye/koishi-plugin-adapter-wechaty)复制的，所以很多逻辑我也没有理清楚，故仅提供基础维护，即：确保在 `Wechaty`本身可用的情况下确保`@cao-mei-you-ren/koishi-plugin-adapter-wechaty`可用。

### 关于 License

由于原项目使用了 [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.zh-cn.html)，故根据 AGPL-3.0，本项目也需要使用 AGPL-3.0 进行开源。

## 💰 支持

如果觉得这个项目有用的话请给一颗⭐️，非常感谢

<a href="https://afdian.net/@CaoMeiYouRen">
  <img src="https://cdn.jsdelivr.net/gh/CaoMeiYouRen/image-hosting-01@master/images/202306192324870.png" width="312px" height="78px" alt="在爱发电支持我">
</a>

<a href="https://patreon.com/CaoMeiYouRen">
    <img src="https://cdn.jsdelivr.net/gh/CaoMeiYouRen/image-hosting-01@master/images/202306142054108.svg" width="312px" height="78px" alt="become a patreon"/>
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/koishi-plugin-adapter-wechaty&type=Date)](https://star-history.com/#CaoMeiYouRen/koishi-plugin-adapter-wechaty&Date)

## 📝 License

Copyright © 2023 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).<br />
This project is [AGPL-3.0](https://github.com/CaoMeiYouRen/koishi-plugin-adapter-wechaty/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
