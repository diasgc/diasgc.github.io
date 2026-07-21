#!/bin/bash

if ! which convert > /dev/null; then
  echo "ImageMagick is not installed. Please install it first."
  exit 1
fi

fonts=($(convert -list font | grep -E '^\s*Font:' | grep -i 'mono' | awk '{print $2}'))
out=$(zenity --forms --title="rEFInd Font Maker" \
  --text="Select a font to generate rEFInd font files." \
  --add-combo="Font" --combo-values="$(echo "${fonts[@]}"|sed 's/ /|/g')" \
  --add-combo="Size" --combo-values="12|14|16|18|20|22|24|26|28|30|32" \
  --add-combo="Color" --combo-values="white|black|custom" \
  --add-entry="Offset" \
  --separator="|")

out=($(echo $out | sed 's/|/ /g'))

case "${out[2]}" in custom)
  out[2]=$(zenity --color-selection --show-palette);;
esac

png_h=${out[1]}
char_w=(${png_h}*6+5)/10
png_w=${char_w}*96
echo "Creating ${png_w}x${png_h} font bitmap...."

convert -size ${png_w}x${png_h} xc:transparent -gravity NorthWest \
    -font ${out[0]} -pointsize ${out[1]} -fill ${out[2]} \
    -draw "text 0,${out[3]:-0} ' !\"#\$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~?'" \
    "${out[0]}-${out[1]}.png" && echo -e "\nFont bitmap created: ${out[0]}-${out[1]}.png\n"