#!/bin/bash
source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 设置初始时间戳
initial_timestamp=$(date +%s)

# 创建目标目录（如果不存在）
mkdir -p "$destination_directory"

# 同步文件夹并持续监听文件变化的函数
sync_and_listen() {
  # 删除目标目录下所有文件
  rm -rf "$destination_directory"/*

  # 等待上传完成
  sleep 20

  # 复制源目录到目标目录
  cp -R "$source_directory/." "$destination_directory/"
  echo "Files copied from $source_directory to $destination_directory"

  # 检查源目录是否与目标目录内容相同
  if diff -qr "$source_directory" "$destination_directory" > /dev/null; then
    # 等待一段时间以确保所有文件都已复制（可根据需要调整等待时间）
    sleep 10

    # 检查目标目录是否有新的文件添加
    new_files=$(diff -qr "$source_directory" "$destination_directory" | grep "Only in $source_directory")

    # 如果没有新文件添加，执行脚本操作
    if [ -z "$new_files" ]; then
      # 执行脚本操作
      cd "$script_directory" || exit
      node index.js
      cd - || exit

      # 继续监听文件变化
      sync_and_listen
    fi
  fi
}

# 初始执行
sync_and_listen
