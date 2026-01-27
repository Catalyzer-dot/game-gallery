# 多阶段构建：编译阶段
FROM golang:1.23-alpine AS builder

WORKDIR /build

# 复制Go模块文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o app.exe main.go

# 最终阶段：Windows容器（适配 Windows Server 2019）
FROM mcr.microsoft.com/windows/nanoserver:1809

WORKDIR /app

# 复制编译好的应用
COPY --from=builder /build/app.exe .

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["app.exe"]
