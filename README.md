# 物质跨膜运输动态模型

这是一个高中生物跨膜运输方式的交互模型。当前页面使用 Canvas 绘制主动画，CSS 绘制对比面板里的小动画。

## 预览

因为项目已经拆成 JavaScript 模块，需要通过本地预览服务打开，不建议直接双击 `index.html`。

在项目文件夹中启动本地预览后，打开：

```txt
http://127.0.0.1:4173/index.html
```

## 目前结构

```txt
src/
  app.js                  主入口：控制界面、绘制流程、点击交互
  core/
    animationState.js     播放状态、动画进度、重播逻辑
  data/
    modelData.js          运输方式、点击说明、颜色配置
```

## 后续加交互动画的建议顺序

1. 先把新的教学内容加到 `src/data/modelData.js`。
2. 再把新动画需要的播放阶段加到 `src/core/animationState.js`。
3. 最后在 `src/app.js` 里新增绘制函数。

下一步最适合继续拆的是 `src/app.js` 里的绘制部分，可以分成膜结构、蛋白结构、粒子路径、ATP 过程几个文件。
