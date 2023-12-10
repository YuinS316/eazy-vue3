const { build } = require("esbuild");
const { remove } = require("fs-extra");
const { join } = require("path");
const watch = require("node-watch");

//  构建
async function runBuild(shouldLog = false) {
  const startTime = new Date().getTime();

  await cleanup();

  // 异步方法，返回一个 Promise
  const result = await build({
    // ----  如下是一些常见的配置  ---
    // 当前项目根目录
    absWorkingDir: process.cwd(),
    // 入口文件列表，为一个数组
    // entryPoints: ["./src/index.js"],
    entryPoints: {
      reactivity: "./src/reactivity/index.ts",
      "runtime-core": "./src/runtime-core/index.ts",
    },
    // 打包产物目录
    outdir: "lib",
    // 是否需要打包，一般设为 true
    bundle: true,
    // 模块格式，包括`esm`、`commonjs`和`iife`
    format: "esm",
    // 需要排除打包的依赖列表
    external: [],
    // 是否开启自动拆包
    splitting: true,
    // 是否生成 SourceMap 文件
    sourcemap: true,
    // 是否生成打包的元信息文件
    metafile: true,
    // 是否进行代码压缩
    minify: false,
    // 是否开启 watch 模式，在 watch 模式下代码变动则会触发重新打包
    watch: false,
    // 是否将产物写入磁盘
    write: true,
    // Esbuild 内置了一系列的 loader，包括 base64、binary、css、dataurl、file、js(x)、ts(x)、text、json
    // 针对一些特殊的文件，调用不同的 loader 进行加载
    // loader: {
    //   '.png': 'base64',
    // }
  });
  const endTime = new Date().getTime();

  if (shouldLog) {
    console.log(result);
  }

  let diffTime = (endTime - startTime) / 1000;
  console.log(`总耗时: ${diffTime}秒`);
}

//  清除旧文件
async function cleanup() {
  const outDir = join(process.cwd(), "lib");

  //  清空文件夹
  await remove(outDir);
}

//  监听文件变化
function watchFileChanges() {
  const entryDirs = join(process.cwd(), "src");
  const watcher = watch(entryDirs, { recursive: true });

  console.log("开始文件监听")
  watcher.on("change", function (evt, name) {
    console.log("检测到文件更新 -> ", name);
    runBuild();
  });

  process.on("exit", () => {
    watcher.close();
    console.log("成功移除监听器");
  });

  process.on("SIGINT", () => {
    console.log("监听到ctrl+c退出程序");
    process.exit();
  })
}

async function main() {
  const args = process.argv.slice(2);

  await runBuild(true);

  //  是否开启文件监听
  if (args[0] === "watch") {
    watchFileChanges();
  }
}

main();
