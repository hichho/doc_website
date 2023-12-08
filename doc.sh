#!/bin/bash

source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

# 监听文件变化并执行拷贝和脚本
/usr/bin/inotifywait -m -r -e create,moved_to "$source_directory" |
while read path action file; do
    echo "Detected file change: $file"

    # 拷贝文件到目标目录
    cp "$source_directory/$file" "$destination_directory/"

    # 检查文件是否成功拷贝到目标目录
    if [ -f "$destination_directory/$file" ]; then
        echo "File copied successfully to destination: $destination_directory/$file"

        # 执行指定的脚本
        cd "$script_directory" || exit
        node index.js "$destination_directory/$file"
        cd - || exit
    else
        echo "Error: File copy failed."
    fi
done
