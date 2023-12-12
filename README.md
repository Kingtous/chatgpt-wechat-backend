# ChatGPT 微信公众号 后端

请扫码进入公众号试用：

![2023-03-10_17-17](https://user-images.githubusercontent.com/39793325/224280748-92f95675-37f2-4388-a517-f5b82b677174.png)



技术栈：NodeJs + Typescript + Fastify


## 如何进行二次开发

本项目依赖aws s3服务作为oss存储，用于存储用户历史问答。

使用`nodemon`，直接输入`npm run dev`运行即可，修改代码后可直接完成启动部署。
推荐使用cyclic.sh网站进行部署，其提供了免费的s3 aws存储。


## 如何添加配置

`.env.example`含有项目必选、可选的配置。填写，并重命名为`.env`。

```shell
CHATGPT_KEY=    #必选
WECHAT_TOKEN=   #必选
WECHAT_APPID=   #可选，没有用过目前
WECHAT_SECRET=  #可选，没有用过目前
BUCKET_NAME= #必选
```

## 如何启动

```shell
npm start
```

项目默认运行至3000端口，使用宝塔面板/Nginx+ACME反向代理体验更佳。

# 特点

自动对接微信后端，无需集成至已有后端项目。

