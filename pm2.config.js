module.exports = {
  apps: [
    {
      name: "blobscan-api", // 应用名称，可自定义
      script: "cd ./apps/rest-api-server && sudo pnpm start", // 运行脚本命令
      // args: "", // 启动命令
      exec_mode: "fork", // 运行模式，可选"cluster"或"fork"
      instances: 1, // 最大实例数，可根据需要自定义
      autorestart: true, // 自动重启
      watch: false, // 监听文件变化，可根据需要自定义
      max_memory_restart: "1000M", // 最大内存限制，可根据需要自定义
    },
    {
      name: "blobscan-web", // 应用名称，可自定义
      script: "cd ./apps/web && sudo pnpm start", // 运行脚本命令
      // args: "",
      exec_mode: "fork", // 运行模式，可选"cluster"或"fork"
      instances: 1, // 最大实例数，可根据需要自定义
      autorestart: true, // 自动重启
      watch: false, // 监听文件变化，可根据需要自定义
      max_memory_restart: "1000M", // 最大内存限制，可根据需要自定义
    },
  ],
};
