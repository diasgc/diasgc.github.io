usr="$(basename $HOME)"

touch ~/Templates/blank.txt

cat <<-EOF >~/Templates/blank.sh
#!/bin/bash
# Bash Script
# Created by ${usr}

EOF

cat <<-EOF >~/Templates/blank.json
{
 "key1": "value1",
 "key2": "value2"
}
EOF

cat <<-EOF >~/Templates/blank.xml
<?xml version = "1.0" encoding = "UTF-8" standalone = "yes" ?>
EOF

cat <<-EOF >~/Templates/blank.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THIS IS TITLE</title>
  <!--
  <link rel="stylesheet" href="style.css">
  -->
</head>
<body>