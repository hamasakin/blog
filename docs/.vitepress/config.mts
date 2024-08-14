import { defineConfig } from "vitepress";
// import AutoSidebar from "vite-plugin-vitepress-auto-sidebar";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/blog/",
  title: "koitori777",
  outDir: "../dist",
  description:
    "A personal blog about programming, web development, and other stuff.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "导航", link: "/" },
      { text: "笔记", link: "/notes/js-module" },
      {
        text: "踩坑记录",
        items: [{ text: "vitepress踩坑", link: "/pitfall/vitepress" }],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/koitori777" }],
    outline: {
      label: "目录",
    },
    sidebar: {
      "/notes/": [
        {
          text: "笔记",
          items: [
            {
              text: "模块化：符号绑定和值拷贝",
              link: "/notes/js-module",
            },
            {
              text: "Vue2源码解析",
              link: "/notes/vue2-source-code",
            },
          ],
        },
      ],
      "/pitfall/": [
        {
          text: "踩坑记录",
          items: [
            {
              text: "vitepress踩坑",
              link: "/pitfall/vitepress",
            },
          ],
        },
      ],
    },
  },
  vite: {
    server: {
      port: 8800,
      strictPort: true,
    },
  },
});
