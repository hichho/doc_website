#!/bin/bash
source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 设置初始时间戳
initial_timestamp=$(date +%s)

# 同步文件夹并监听文件变化并执行脚本
while true; do
  # 等待文件变化
  /usr/bin/inotifywait -q -e create -e delete -e move -r "$source_directory"

  # 同步源目录到目标目录（包括子目录和文件）
  rsync -r -u "$source_directory/" "$destination_directory/"
  echo "Files synchronized from $source_directory to $destination_directory"

  # 执行脚本操作
  cd "$script_directory" || exit
  node index.js
  cd - || exit

  # 更新时间戳
  initial_timestamp=$(date +%s)
done
