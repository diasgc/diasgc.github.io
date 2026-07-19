#!/bin/bash
efi_modes=($(cat /sys/class/graphics/fb*/modes | grep -oE '[0-9]+x[0-9]+' | sed 's/x/ /g'))
microsoft-edge "https://diasgc.github.io/ubuntu-setup/res/index.html?t=grub&usr=${USER}&w=${efi_modes[0]}&h=${efi_modes[1]}"

# sudo sed -i "s/menuentry '\$LABEL'/menuentry --class uefi-firmware '\$LABEL'/g" /etc/grub.d/*_uefi-firmware
# sudo sed -i "submenu 'Advanced options for Ubuntu' \$menuentry_id_option/submenu 'Advanced options for Ubuntu' --class ubuntu \$menuentry_id_option/g" /etc/grub.d/*_linux
