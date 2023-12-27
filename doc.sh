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

  # 删除目标目录下所有文件
  rm -rf "$destination_directory"/*

  # 复制源目录到目标目录
  cp -R "$source_directory/." "$destination_directory/"
  echo "Files copied from $source_directory to $destination_directory"

  # 检查源目录是否与目标目录相同
  diff_output=$(diff -qr "$source_directory" "$destination_directory")

  # 如果源目录与目标目录内容相同
  if [ -z "$diff_output" ]; then
    # 执行脚本操作
    cd "$script_directory" || exit
    node index.js
    cd - || exit

    # 结束循环，任务完成
    break
  fi
done
