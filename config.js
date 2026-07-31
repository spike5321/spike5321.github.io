/* ============================================================
   站点配置 —— 这是你唯一需要改的"设置文件"
   改完保存，刷新网页即可看到效果。
   ============================================================ */

window.SITE = {
  // 网站标题（浏览器标签、页面左上角）
  title: "信号与噪音 .by spike",

  // 你的名字或昵称（首页大标题）
  author: "Spike",

  // 一句话自我介绍（首页副标题）
  tagline: "在一堆噪音里，记下那些像是信号的东西。",

  // 关于页顶部的头衔（可留空）
  role: "",

  // 头像：填图片路径如 "images/avatar.jpg"；留空则自动用首字母生成圆形头像
  avatar: "",

  // 页脚版权年份起始
  startYear: 2026,

  // 社交链接：不需要的整行删掉即可，顺序就是显示顺序
  // 以后想加新平台，照着格式加一行，去掉行首的 // 就生效
  links: [
    { name: "GitHub", url: "https://github.com/spike5321" },
    { name: "邮箱",   url: "mailto:1450854842@qq.com" }
    // { name: "X",      url: "https://x.com/你的ID" },
    // { name: "微博",    url: "https://weibo.com/你的ID" },
    // { name: "小红书",  url: "https://www.xiaohongshu.com/user/profile/你的ID" },
    // { name: "B站",     url: "https://space.bilibili.com/你的ID" },
    // { name: "知乎",    url: "https://www.zhihu.com/people/你的ID" }
  ],

  // 主题色（用于链接、标签、强调）。默认是克制的蓝色。
  // 换个心情可以试试：#e07a5f 暖橘 / #2a9d8f 松绿 / #7c5cbf 紫
  accent: "#3563e9",

  // 首页每页显示多少篇文章
  pageSize: 10
};
