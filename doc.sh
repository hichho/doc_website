#!/bin/bash

source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 监听文件变化并执行拷贝和脚本
( /usr/bin/inotifywait -m -r -e create,moved_to "$source_directory" &
  PID=$!

  # 等待10秒钟
  sleep 10

  # 等待inotifywait结束
  wait $PID

  # 执行指定的脚本
  cd "$script_directory" || exit
  node index.js
  cd - || exit
)
