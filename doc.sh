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
  rsync -av --delete "$source_directory/" "$destination_directory/"
  echo "Files synchronized from $source_directory to $destination_directory"

  # 获取同步结束时间戳
  sync_end_timestamp=$(date +%s)

  # 检查是否超过一定时间，确保所有文件都已经同步完成
  time_difference=$((sync_end_timestamp - initial_timestamp))
  
  if [ $time_difference -ge 5 ]; then
    # 执行脚本操作
    cd "$script_directory" || exit
    node index.js
    cd - || exit

    # 重置时间戳
    initial_timestamp=$(date +%s)
  fi
done
