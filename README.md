# Homebridge Aqara Plugin v2

这是原项目 [baranwang/homebridge-plugin-aqara](https://github.com/baranwang/homebridge-plugin-aqara) 的 Homebridge v2 兼容维护分支。

## 支持设备

- Aqara 智能晾衣机 Lite（`lumi.airer.acn001`）
- Aqara 智能晾衣机 H1（`lumi.airer.acn02`；Aqara API 暂不支持控制行程百分比）
- 红外模拟电视遥控器（`virtual.ir.tv`）

## 环境要求

- Homebridge 2.x
- Node.js 22.12.0 或更高版本（Node 22、24 或 26）

## 构建

```sh
npm install
npm run build
```

基于原项目 Apache-2.0 许可证修改。设备功能依赖 Aqara 开放平台 API。
