#!/bin/bash

source_directory="/var/ftp/admin/doc"
destination_directory="/var/project/doc_website/docFile"
script_directory="/var/project/doc_website/script"

files_copied=0  # 用于跟踪已拷贝的文件数量

# 监听文件变化并执行拷贝
/usr/bin/inotifywait -m -r -e create,moved_to "$source_directory" |
while read path action file; do
    echo "Detected file change: $file"

    # 拷贝文件到目标目录
    cp "$source_directory/$file" "$destination_directory/"

    # 检查文件是否成功拷贝到目标目录
    if [ -f "$destination_directory/$file" ]; then
        echo "File copied successfully to destination: $destination_directory/$file"
        ((files_copied++))
    else
        echo "Error: File copy failed."
    fi
done

# 循环结束后执行 index.js
echo "Total files copied: $files_copied"
if [ "$files_copied" -gt 0 ]; then
    echo "All files copied, executing index.js"
    cd "$script_directory" || exit
    node index.js
    cd - || exit
else
    echo "No files copied, skipping index.js execution."
fi
