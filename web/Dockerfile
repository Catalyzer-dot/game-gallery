# 前端多阶段构建

# 第一阶段：构建Vue应用
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用（设置开发模式，使base路径为'/'）
ENV NODE_ENV=development
RUN npm run build

# 第二阶段：使用Nginx提供静态文件
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# 复制构建产物
COPY --from=builder /app/dist .

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
