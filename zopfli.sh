#!/bin/bash

# Проверка наличия zopfli
if ! command -v zopfli &> /dev/null; then
	echo "Ошибка: zopfli не установлен. Установите его сначала."
	echo "Для Ubuntu/Debian: sudo apt install zopfli"
	echo "Для CentOS/RHEL: sudo yum install zopfli"
	exit 1
fi

# Указываем папку (можно передать как аргумент скрипта)
TARGET_DIR="${1:-./}"

# Максимальное количество итераций сжатия (по умолчанию в zopfli - 15)
ITERATIONS=100

# Минимальный размер файла для сжатия (1 КБ = 1024 байт)
MIN_SIZE=1024

# Рекурсивно ищем файлы, пропускаем .gz и файлы меньше MIN_SIZE
find "$TARGET_DIR" -type f ! -name "*.gz" -size +"$MIN_SIZE"c -print0 | while IFS= read -r -d '' file; do
	zopfli --i"$ITERATIONS" --gzip "$file"
done

echo "Сжатие завершено!"
