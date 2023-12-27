#!/bin/bash
source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 设置初始时间戳
initial_timestamp=$(date +%s)

# 监听文件变化并执行拷贝和脚本
while true; do
  # 等待文件变化
  /usr/bin/inotifywait -q -e create -r "$source_directory"

  # 检查文件是否在最后10秒内有新的改动
  current_timestamp=$(date +%s)
  difference=$((current_timestamp - initial_timestamp))

  if [ $difference -ge 10 ]; then
    # 输出目录内容以便调试
    ls -la "$source_directory/"

    # 执行拷贝操作
    cp -r "$source_directory"/* "$destination_directory/"
    echo "Files copied to $destination_directory"

    # 执行脚本操作
    cd "$script_directory" || exit
    node index.js
    cd - || exit

    # 更新时间戳
    initial_timestamp=$(date +%s)
  fi
done
