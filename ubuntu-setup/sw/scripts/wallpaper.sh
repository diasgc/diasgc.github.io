#!/bin/bash
# Bash Script
# Created by diasgc
#

if [ -z "$(which microsoft-edge)" ]; then
  echo "Install Microsoft Edge first"
  xdg-open "https://www.microsoft.com/en-us/edge/download"
  wait 
  read -p "Press any key when ready"
fi

usr="$(basename $HOME)"

vrs="$(lsb_release -r | grep -oP "[0-9.]+")"
vstr="$(lsb_release -d | sed "s;.*Description:[[:space:]]*;;g")"
gnome="$(gnome-shell --version | grep -oP '\d\d')"

vnd="$(sed 's/.*/\L&/' /sys/devices/virtual/dmi/id/sys_vendor)"
case "${vnd,,}" in
  *besstar*)   vnd="minisforum" ;;
  *microsoft*) vnd="$(cat /sys/devices/virtual/dmi/id/product_family)";;
esac

res=($(cat /sys/class/graphics/fb0/modes | grep -oP '\d+x\d+' | sed 's,x, ,g'))
user=$(basename ${HOME})

#echo "user $user vendor $vnd res ${res[@]}"

#microsoft-edge "https://diasgc.github.io/ubuntu-setup/sw"
microsoft-edge "https://diasgc.github.io/ubuntu-setup/res?vnd=${vnd,,}&w=${res[0]}&h=${res[1]}&usr=${user}&fstr=${vstr}"
read -p "Press any key to exit..."
