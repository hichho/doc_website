#!/bin/bash
source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 设置初始时间戳
initial_timestamp=$(date +%s)

# 同步文件夹并监听文件变化
while true; do
  # 等待文件变化
  /usr/bin/inotifywait -q -e create -e delete -e move -r "$source_directory"

  # 同步源目录到目标目录（覆盖目标目录）
  rsync -av --delete "$source_directory/" "$destination_directory/"
  echo "Files synchronized from $source_directory to $destination_directory"

  # 检查源目录是否完全同步到目标目录
  diff_output=$(diff -qr "$source_directory" "$destination_directory")

  # 如果源目录与目标目录内容相同
  if [ -z "$diff_output" ]; then
    # 记录同步完成时间戳
    sync_end_timestamp=$(date +%s)

    # 检查同步完成后是否经过一段时间，用于确保所有文件已复制
    time_difference=$((sync_end_timestamp - initial_timestamp))

    # 如果已经经过一段时间（比如5秒），则执行脚本
    if [ $time_difference -ge 5 ]; then
      # 执行脚本操作
      cd "$script_directory" || exit
      node index.js
      cd - || exit

      # 结束循环，任务完成
      break
    fi
  fi
done
