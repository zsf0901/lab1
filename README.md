# SVG Editor CLI — Lab1 Phase 1

TypeScript 面向对象 SVG 编辑器，支持 rect、circle、ellipse、line、text、g，Command 撤销重做与 Composite 容器操作。

环境：Node.js 24.22 或更高版本、npm。

```sh
npm install
npm run cli
npm test
npm run check
```

在 `svg>` 后输入 `help` 查看命令。输入结束（Windows Ctrl+Z 后回车，其他系统 Ctrl+D）退出。命令脚本也可通过标准输入回放：

```sh
node src/main.ts < examples/flowchart.txt
```

生成的 `flowchart.svg` 可用浏览器打开。详细架构、过程记录、验证结果及限制见 [doc/README.md](doc/README.md)。

Phase 1 不实现 box 插件类型。GitHub 仓库：https://github.com/zsf0901/lab1
