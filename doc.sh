#!/bin/bash

source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 设置初始时间戳
initial_timestamp=$(date +%s)

# 监听文件变化并执行拷贝和脚本
( /usr/bin/inotifywait -m -r -e create,moved_to "$source_directory" &
  PID=$!

  # 等待一段时间
  sleep 10

  # 检查文件是否在最后10秒内有新的改动
  while true; do
    current_timestamp=$(date +%s)
    difference=$((current_timestamp - initial_timestamp))

    if [ $difference -ge 10 ]; then
        # 执行拷贝操作
        cp -r "$source_directory"/* "$destination_directory/"
        echo "Files copied to $destination_directory"

        # 执行脚本操作
        cd "$script_directory" || exit
        node index.js
        cd - || exit
        break
    fi

    # 等待一小段时间后再次检查文件
    sleep 5
  done

  # 等待inotifywait结束
  wait $PID
)
